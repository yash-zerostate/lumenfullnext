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
 * The Preta context JWT (`data-ctx-cookie`). Unlike the three above this one is
 * deliberately NOT `httpOnly` — the loader runs in the browser and has to read it.
 *
 * That is safe because of what is inside: a *signed* token carrying only
 * targeting attributes. Editing it breaks the signature, and it authenticates
 * nothing against this app — the real session stays in the httpOnly cookies.
 */
export const PRETA_COOKIE = "preta_ctx";

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
  tokens: { accessToken: string; refreshToken: string; pretaToken?: string | null },
): NextResponse {
  // Refreshed on the same schedule as the access token, so it can never go stale
  // while the session is alive — login, register and every silent refresh all
  // pass through here.
  if (tokens.pretaToken) {
    response.cookies.set(PRETA_COOKIE, tokens.pretaToken, {
      ...base,
      httpOnly: false, // the loader must be able to read it
      maxAge: env.accessTtlMinutes * 60,
    });
  }
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
  // Clearing this is what removes personalised elements at logout — the loader
  // finds no cookie, sends no context, and the edge matches nothing.
  response.cookies.set(PRETA_COOKIE, "", { ...base, httpOnly: false, maxAge: 0 });
  return response;
}
