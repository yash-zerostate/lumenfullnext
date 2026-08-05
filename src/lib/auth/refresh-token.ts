import { createHash, randomBytes, randomUUID } from "node:crypto";

/**
 * Refresh tokens are opaque, not JWTs: they must be revocable server-side, and
 * a self-contained token cannot be. Node-only — never import this from
 * middleware.
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newFamilyId(): string {
  return randomUUID();
}
