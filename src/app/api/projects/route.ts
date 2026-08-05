import type { NextRequest } from "next/server";

import { getSessionClaims } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, jsonOk } from "@/lib/http";
import { fieldErrors, projectSchema } from "@/lib/validation";
import { Project } from "@/models/Project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How many projects each plan may keep active. */
const PROJECT_LIMIT: Record<string, number> = { free: 1, pro: 5, enterprise: 50 };

export async function GET() {
  const claims = await getSessionClaims();
  if (!claims) return jsonError(401, "unauthenticated", "Not signed in.");

  await connectToDatabase();
  const projects = await Project.find({ ownerId: claims.sub, archivedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  return jsonOk({
    projects: projects.map((project) => ({
      id: String(project._id),
      name: project.name,
      domain: project.domain,
      environment: project.environment,
      monthlyEvents: project.monthlyEvents,
      uniqueVisitors: project.uniqueVisitors,
      conversionRate: project.conversionRate,
      createdAt: project.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const claims = await getSessionClaims();
  if (!claims) return jsonError(401, "unauthenticated", "Not signed in.");

  const body = await request.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "invalid_input", "Please fix the highlighted fields.", {
      fields: fieldErrors(parsed.error),
    });
  }

  await connectToDatabase();

  const limit = PROJECT_LIMIT[claims.plan] ?? 1;
  const active = await Project.countDocuments({ ownerId: claims.sub, archivedAt: null });
  if (active >= limit) {
    return jsonError(
      402,
      "plan_limit_reached",
      `The ${claims.plan} plan allows ${limit} project${limit === 1 ? "" : "s"}. Upgrade to add more.`,
    );
  }

  const duplicate = await Project.findOne({
    ownerId: claims.sub,
    domain: parsed.data.domain,
  })
    .select("_id")
    .lean();
  if (duplicate) {
    return jsonError(409, "duplicate_domain", "You already track that domain.", {
      fields: { domain: "You already track that domain." },
    });
  }

  const project = await Project.create({ ...parsed.data, ownerId: claims.sub });

  return jsonOk(
    {
      project: {
        id: String(project._id),
        name: project.name,
        domain: project.domain,
        environment: project.environment,
        monthlyEvents: project.monthlyEvents,
        uniqueVisitors: project.uniqueVisitors,
        conversionRate: project.conversionRate,
        createdAt: project.createdAt,
      },
    },
    { status: 201 },
  );
}
