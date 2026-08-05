import { NextResponse, type NextRequest } from "next/server";

import { verifyAccessToken } from "@/lib/auth/access-token";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";

/**
 * Gate every /dashboard route before it renders.
 *
 * Three outcomes:
 *   valid access cookie      → render
 *   expired but has a session hint → bounce through /api/auth/refresh, which
 *                              rotates the refresh token and redirects back
 *   nothing                  → /login?next=…
 *
 * The refresh cookie is scoped to /api/auth, so middleware cannot read it — the
 * `lumen_has_session` hint cookie exists purely so we know whether a refresh
 * round-trip is worth attempting.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  if (accessToken && (await verifyAccessToken(accessToken))) {
    return NextResponse.next();
  }

  const target = `${pathname}${search}`;
  const hasSession = request.cookies.has("lumen_has_session");

  if (hasSession) {
    const refreshUrl = new URL("/api/auth/refresh", request.nextUrl.origin);
    refreshUrl.searchParams.set("next", target);
    return NextResponse.redirect(refreshUrl);
  }

  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("next", target);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
