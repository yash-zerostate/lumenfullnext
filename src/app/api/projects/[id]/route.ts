import { Types } from "mongoose";
import type { NextRequest } from "next/server";

import { getSessionClaims } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, jsonOk } from "@/lib/http";
import { Project } from "@/models/Project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const claims = await getSessionClaims();
  if (!claims) return jsonError(401, "unauthenticated", "Not signed in.");

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return jsonError(400, "invalid_id", "That project id is not valid.");
  }

  await connectToDatabase();

  // Ownership is part of the query, not a separate check — there is no code path
  // where a matching id alone is enough to delete someone else's project.
  const result = await Project.updateOne(
    { _id: id, ownerId: claims.sub, archivedAt: null },
    { $set: { archivedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return jsonError(404, "not_found", "Project not found.");
  }

  return jsonOk({ ok: true });
}
