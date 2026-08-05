import type { NextRequest } from "next/server";

import { setAuthCookies } from "@/lib/auth/cookies";
import { fakeVerify, verifyPassword } from "@/lib/auth/password";
import { issueSession, toSessionUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema } from "@/lib/validation";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILED_LOGINS = 8;
const LOCK_MINUTES = 15;

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const ip = clientIp(request);
  const limit = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", "Too many attempts. Try again in a few minutes.", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "invalid_input", "Please fix the highlighted fields.", {
      fields: fieldErrors(parsed.error),
    });
  }

  const { email, password } = parsed.data;

  await connectToDatabase();

  // passwordHash is `select: false` on the schema, so ask for it explicitly.
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    await fakeVerify(); // equalise timing with the "user exists" branch
    return jsonError(401, "invalid_credentials", "Email or password is incorrect.");
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return jsonError(
      423,
      "account_locked",
      "Too many failed attempts. This account is temporarily locked.",
    );
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    const failed = (user.failedLoginCount ?? 0) + 1;
    user.failedLoginCount = failed;
    if (failed >= MAX_FAILED_LOGINS) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLoginCount = 0;
    }
    await user.save();
    return jsonError(401, "invalid_credentials", "Email or password is incorrect.");
  }

  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueSession(user, {
    userAgent: request.headers.get("user-agent") ?? "",
    ip,
  });

  return setAuthCookies(jsonOk({ user: toSessionUser(user) }), tokens);
}
