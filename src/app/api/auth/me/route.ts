import type { NextRequest } from "next/server";

import { getCurrentUser, getSessionClaims, toSessionUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, jsonOk } from "@/lib/http";
import { fieldErrors, profileSchema } from "@/lib/validation";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "unauthenticated", "Not signed in.");
  return jsonOk({ user });
}

/**
 * Lets an account edit its own profile — including plan and risk score, which a
 * real product would take from billing and a scoring service. Here it is the
 * fastest way to flip an existing account's attributes and see targeting change
 * without registering a new user.
 */
export async function PATCH(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const claims = await getSessionClaims();
  if (!claims) return jsonError(401, "unauthenticated", "Not signed in.");

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "invalid_input", "Please fix the highlighted fields.", {
      fields: fieldErrors(parsed.error),
    });
  }

  const { name, active, plan, role, riskScore } = parsed.data;

  await connectToDatabase();
  const user = await User.findByIdAndUpdate(
    claims.sub,
    { $set: { name, plan, role, riskScore, active: active === "yes" } },
    { new: true },
  );
  if (!user) return jsonError(401, "unauthenticated", "Not signed in.");

  return jsonOk({ user: toSessionUser(user) });
}
