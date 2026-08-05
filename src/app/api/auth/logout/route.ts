import type { NextRequest } from "next/server";

import { REFRESH_COOKIE, clearAuthCookies } from "@/lib/auth/cookies";
import { revokeSession } from "@/lib/auth/session";
import { assertSameOrigin, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  // Revoke server-side first: clearing the cookie alone would leave a working
  // refresh token in the hands of anyone who copied it.
  await revokeSession(request.cookies.get(REFRESH_COOKIE)?.value);

  return clearAuthCookies(jsonOk({ ok: true }));
}
