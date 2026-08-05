import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProjectManager, type ProjectView } from "@/components/ProjectManager";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { Project } from "@/models/Project";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

const PROJECT_LIMIT: Record<string, number> = { free: 1, pro: 5, enterprise: 50 };

export default async function DashboardPage() {
  // Middleware already gated this route; this second check is what makes the
  // page safe on its own if the matcher ever changes.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  await connectToDatabase();
  const rows = await Project.find({ ownerId: user.id, archivedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  const projects: ProjectView[] = rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    domain: row.domain,
    environment: row.environment as ProjectView["environment"],
    monthlyEvents: row.monthlyEvents,
    uniqueVisitors: row.uniqueVisitors,
    conversionRate: row.conversionRate,
  }));

  const totals = projects.reduce(
    (acc, project) => ({
      events: acc.events + project.monthlyEvents,
      visitors: acc.visitors + project.uniqueVisitors,
    }),
    { events: 0, visitors: 0 },
  );

  const limit = PROJECT_LIMIT[user.plan] ?? 1;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />

      <main className="container-page flex-1 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {user.name.split(" ")[0]}&rsquo;s workspace
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {projects.length} of {limit} project{limit === 1 ? "" : "s"} used
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge">{user.plan} plan</span>
            <span className="badge">{user.role}</span>
            <span className="badge">risk {user.riskScore}</span>
            <span className="badge">{user.active ? "active" : "inactive"}</span>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <dt className="text-xs uppercase tracking-wider text-slate-500">Events this month</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {totals.events.toLocaleString()}
            </dd>
          </div>
          <div className="card">
            <dt className="text-xs uppercase tracking-wider text-slate-500">Unique visitors</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {totals.visitors.toLocaleString()}
            </dd>
          </div>
          <div className="card">
            <dt className="text-xs uppercase tracking-wider text-slate-500">Active projects</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{projects.length}</dd>
          </div>
        </dl>

        <div className="mt-10">
          <ProjectManager initialProjects={projects} planLimit={limit} plan={user.plan} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
