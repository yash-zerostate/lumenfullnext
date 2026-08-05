import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data as Record<string, unknown>, init);
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

/**
 * Cookie auth + `SameSite=Lax` still allows a cross-site top-level POST form to
 * reach us, so mutating handlers verify the Origin header themselves.
 *
 * The allowed origin is derived from the request's own Host header rather than
 * hard-coded, because a platform like Vercel serves the same build from several
 * hostnames (production domain, `*.vercel.app`, per-PR preview URLs). Pinning it
 * to one APP_ORIGIN would make every POST on a preview deployment 403.
 * APP_ORIGIN is still accepted, for a fixed custom domain behind a proxy.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null; // same-origin GET/HEAD and server-side calls send none

  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? (env.isProd ? "https" : "http");
  const selfOrigin = host ? `${proto}://${host}` : null;

  if (origin === selfOrigin || origin === env.appOrigin) return null;
  return jsonError(403, "cross_origin", "Cross-origin request rejected.");
}
