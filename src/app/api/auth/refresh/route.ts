import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { rotateSession, toSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function rotate(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`refresh:${ip}`, 60, 10 * 60 * 1000);
  if (!limit.allowed) return { limited: true } as const;

  const result = await rotateSession(request.cookies.get(REFRESH_COOKIE)?.value, {
    userAgent: request.headers.get("user-agent") ?? "",
    ip,
  });
  return { limited: false, result } as const;
}

/** XHR path: the browser calls this when an API request comes back 401. */
export async function POST(request: NextRequest) {
  const rotated = await rotate(request);
  if (rotated.limited) {
    return jsonError(429, "rate_limited", "Too many refresh attempts.");
  }
  if (!rotated.result.ok) {
    return clearAuthCookies(
      jsonError(401, `refresh_${rotated.result.reason}`, "Your session has ended. Please sign in."),
    );
  }
  return setAuthCookies(
    jsonOk({ user: toSessionUser(rotated.result.user) }),
    rotated.result.tokens,
  );
}

/**
 * Navigation path: middleware sends a browser here when the access cookie has
 * expired but a refresh cookie is still present, then we bounce back to the
 * page the user actually asked for. This is what keeps a 15-minute access token
 * invisible during normal browsing.
 */
export async function GET(request: NextRequest) {
  const nextParam = request.nextUrl.searchParams.get("next") || "/dashboard";
  // Only ever redirect within this site.
  const target = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const rotated = await rotate(request);

  if (rotated.limited || !rotated.result.ok) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("next", target);
    loginUrl.searchParams.set("reason", "session_expired");
    return clearAuthCookies(NextResponse.redirect(loginUrl));
  }

  return setAuthCookies(
    NextResponse.redirect(new URL(target, request.nextUrl.origin)),
    rotated.result.tokens,
  );
}
