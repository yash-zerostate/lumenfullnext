import type { NextResponse } from "next/server";

import { env } from "@/lib/env";

export const ACCESS_COOKIE = "lumen_access";
export const REFRESH_COOKIE = "lumen_refresh";
/**
 * The refresh cookie is scoped to /api/auth, so middleware (which runs on
 * /dashboard) cannot see it. This site-wide flag carries no secret — it only
 * tells middleware "a session exists, a refresh round-trip is worth trying".
 */
export const SESSION_HINT_COOKIE = "lumen_has_session";

/**
 * Same-origin app, so `SameSite=Lax` is enough: the cookie rides every
 * navigation and same-origin fetch, but not a cross-site POST — which is the
 * CSRF vector we care about.
 */
const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProd,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): NextResponse {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: env.accessTtlMinutes * 60,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    // Scoped to the refresh route only: no other endpoint ever needs to see it,
    // so an XSS-free-but-leaky endpoint cannot reflect it back.
    path: "/api/auth",
    maxAge: env.refreshTtlDays * 24 * 60 * 60,
  });
  response.cookies.set(SESSION_HINT_COOKIE, "1", {
    ...base,
    maxAge: env.refreshTtlDays * 24 * 60 * 60,
  });
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE, "", { ...base, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...base, path: "/api/auth", maxAge: 0 });
  response.cookies.set(SESSION_HINT_COOKIE, "", { ...base, maxAge: 0 });
  return response;
}
