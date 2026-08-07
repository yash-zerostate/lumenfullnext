import { cookies } from "next/headers";

import { connectToDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { RefreshToken } from "@/models/RefreshToken";
import { User, type UserDoc } from "@/models/User";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookies";
import {
  signAccessToken,
  verifyAccessToken,
  type AccessClaims,
} from "@/lib/auth/access-token";
import {
  generateRefreshToken,
  hashRefreshToken,
  newFamilyId,
} from "@/lib/auth/refresh-token";
import { createPretaContextToken } from "@/lib/preta-token";

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  /** Signed Preta context JWT — goes into a readable cookie the loader reads. */
  pretaToken: string | null;
};

/** The attributes Preta targets on, taken straight off the user row. */
function pretaAttributes(user: UserDoc) {
  return {
    plan: String(user.plan),
    role: String(user.role),
    active: user.active !== false,
    risk_score: user.riskScore,
  };
}

/** The shared user profile — identical field names across all three demo apps. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  plan: "free" | "pro" | "enterprise";
  role: "developer" | "security" | "marketing" | "compliance";
  riskScore: number;
};

export function toSessionUser(user: UserDoc): SessionUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    active: user.active !== false,
    plan: user.plan as SessionUser["plan"],
    role: user.role as SessionUser["role"],
    riskScore: user.riskScore,
  };
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.refreshTtlDays * 24 * 60 * 60 * 1000);
}

/** Start a brand new session (login / registration). */
export async function issueSession(
  user: UserDoc,
  context: { userAgent?: string; ip?: string } = {},
): Promise<IssuedTokens> {
  const familyId = newFamilyId();
  const refreshToken = generateRefreshToken();

  await RefreshToken.create({
    userId: user._id,
    familyId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshExpiry(),
    userAgent: context.userAgent ?? "",
    ip: context.ip ?? "",
  });

  const accessToken = await signAccessToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    active: user.active !== false,
    plan: user.plan as AccessClaims["plan"],
    role: user.role as AccessClaims["role"],
    riskScore: user.riskScore,
    sid: familyId,
  });

  return {
    accessToken,
    refreshToken,
    pretaToken: await createPretaContextToken(pretaAttributes(user)),
  };
}

export type RotateResult =
  | { ok: true; tokens: IssuedTokens; user: UserDoc }
  | { ok: false; reason: "missing" | "invalid" | "expired" | "reused" | "revoked" };

/**
 * Exchange a refresh token for a new pair. The presented token is always
 * consumed: on success it is marked as replaced, and if a consumed token is
 * presented again the entire family is revoked (assume theft).
 */
export async function rotateSession(
  presentedToken: string | undefined,
  context: { userAgent?: string; ip?: string } = {},
): Promise<RotateResult> {
  if (!presentedToken) return { ok: false, reason: "missing" };

  await connectToDatabase();
  const tokenHash = hashRefreshToken(presentedToken);
  const record = await RefreshToken.findOne({ tokenHash });

  if (!record) return { ok: false, reason: "invalid" };

  if (record.revokedAt) {
    // Replay of a token we already rotated away — kill every sibling.
    await RefreshToken.updateMany(
      { familyId: record.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return { ok: false, reason: "reused" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await RefreshToken.updateOne({ _id: record._id }, { $set: { revokedAt: new Date() } });
    return { ok: false, reason: "expired" };
  }

  const user = await User.findById(record.userId);
  if (!user) {
    await RefreshToken.updateMany(
      { familyId: record.familyId },
      { $set: { revokedAt: new Date() } },
    );
    return { ok: false, reason: "revoked" };
  }

  const nextToken = generateRefreshToken();
  const nextHash = hashRefreshToken(nextToken);

  await RefreshToken.create({
    userId: user._id,
    familyId: record.familyId,
    tokenHash: nextHash,
    expiresAt: refreshExpiry(),
    userAgent: context.userAgent ?? record.userAgent,
    ip: context.ip ?? record.ip,
  });

  await RefreshToken.updateOne(
    { _id: record._id },
    { $set: { revokedAt: new Date(), replacedByHash: nextHash } },
  );

  const accessToken = await signAccessToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    active: user.active !== false,
    plan: user.plan as AccessClaims["plan"],
    role: user.role as AccessClaims["role"],
    riskScore: user.riskScore,
    sid: record.familyId,
  });

  return {
    ok: true,
    user,
    tokens: {
      accessToken,
      refreshToken: nextToken,
      // Re-signed from the LIVE user row, so an attribute changed since login is
      // picked up on the next refresh rather than waiting for a re-login.
      pretaToken: await createPretaContextToken(pretaAttributes(user)),
    },
  };
}

/** Revoke the whole family behind this refresh token (logout). */
export async function revokeSession(presentedToken: string | undefined): Promise<void> {
  if (!presentedToken) return;
  await connectToDatabase();
  const record = await RefreshToken.findOne({ tokenHash: hashRefreshToken(presentedToken) });
  if (!record) return;
  await RefreshToken.updateMany(
    { familyId: record.familyId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

/** Read the access-token claims in a Server Component / Route Handler. */
export async function getSessionClaims(): Promise<AccessClaims | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

/**
 * Load the live user row for the current request. Goes to the database on
 * purpose: a plan change or a deactivated account must take effect immediately,
 * not 15 minutes later when the access token happens to expire.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;
  await connectToDatabase();
  const user = await User.findById(claims.sub);
  return user ? toSessionUser(user) : null;
}

export async function readRefreshCookie(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}
