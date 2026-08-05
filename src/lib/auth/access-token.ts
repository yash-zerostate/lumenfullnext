import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";

/**
 * Deliberately free of `node:crypto` imports: middleware runs on the Edge
 * runtime and only ever needs to *verify*, so this module must stay portable.
 * Anything that needs Node crypto lives in `refresh-token.ts`.
 *
 * The claims mirror the shared user profile, so anything reading this token
 * sees the same attribute names the other two demo apps use.
 */
export type AccessClaims = {
  sub: string;
  email: string;
  name: string;
  active: boolean;
  plan: "free" | "pro" | "enterprise";
  role: "developer" | "security" | "marketing" | "compliance";
  riskScore: number;
  /** Session (refresh-token family) id — ties an access token to one login. */
  sid: string;
};

const ISSUER = "lumen-analytics";
const AUDIENCE = "lumen-web";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.jwtSecret);
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.accessTtlMinutes}m`)
    .sign(secretKey());
}

/** Returns the claims, or null for any invalid/expired token. Never throws. */
export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: String(payload.name ?? ""),
      active: payload.active !== false,
      plan: (payload.plan as AccessClaims["plan"]) ?? "free",
      role: (payload.role as AccessClaims["role"]) ?? "developer",
      riskScore: typeof payload.riskScore === "number" ? payload.riskScore : 1,
      sid: String(payload.sid ?? ""),
    };
  } catch {
    return null;
  }
}
