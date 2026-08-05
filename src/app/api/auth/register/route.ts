import type { NextRequest } from "next/server";

import { setAuthCookies } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { issueSession, toSessionUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, registerSchema } from "@/lib/validation";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const ip = clientIp(request);
  const limit = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError(429, "rate_limited", "Too many sign-up attempts. Try again later.", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "invalid_input", "Please fix the highlighted fields.", {
      fields: fieldErrors(parsed.error),
    });
  }

  const { email, password, active, plan, role, riskScore } = parsed.data;
  // Name is optional; fall back to the email's local part so the UI always has
  // something to greet the user with.
  const name = parsed.data.name || email.split("@")[0]!;

  await connectToDatabase();

  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) {
    return jsonError(409, "email_taken", "That email is already registered.", {
      fields: { email: "That email is already registered." },
    });
  }

  const user = await User.create({
    name,
    email,
    plan,
    role,
    riskScore,
    // `active` is a plain profile attribute here — it is carried in the token
    // for targeting, and deliberately does NOT gate signing in.
    active: active === "yes",
    passwordHash: await hashPassword(password),
    lastLoginAt: new Date(),
  });

  const tokens = await issueSession(user, {
    userAgent: request.headers.get("user-agent") ?? "",
    ip,
  });

  return setAuthCookies(jsonOk({ user: toSessionUser(user) }, { status: 201 }), tokens);
}
