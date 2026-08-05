"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProjectView = {
  id: string;
  name: string;
  domain: string;
  environment: "production" | "staging";
  monthlyEvents: number;
  uniqueVisitors: number;
  conversionRate: number;
};

type ApiError = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

export function ProjectManager({
  initialProjects,
  planLimit,
  plan,
}: {
  initialProjects: ProjectView[];
  planLimit: number;
  plan: string;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const atLimit = projects.length >= planLimit;

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFields({});
    setMessage(null);
    setBusy(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = payload as ApiError;
        setFields(error.error?.fields ?? {});
        setMessage(error.error?.message ?? "Could not create the project.");
        return;
      }

      setProjects((current) => [payload.project as ProjectView, ...current]);
      form.reset();
      router.refresh(); // keep the server-rendered totals honest
    } finally {
      setBusy(false);
    }
  }

  async function archiveProject(id: string) {
    setMessage(null);
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Could not archive that project.");
      return;
    }
    setProjects((current) => current.filter((project) => project.id !== id));
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Projects</h2>

        {projects.length === 0 ? (
          <p className="card mt-4 text-sm text-slate-400">
            No projects yet. Add your first domain to start collecting events.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
                    <span className="badge">{project.environment}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{project.domain}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {project.monthlyEvents.toLocaleString()} events ·{" "}
                    {project.uniqueVisitors.toLocaleString()} visitors ·{" "}
                    {project.conversionRate.toFixed(1)}% conversion
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => archiveProject(project.id)}
                  className="btn-ghost shrink-0 text-xs"
                >
                  Archive
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="card h-fit">
        <h2 className="text-sm font-semibold text-white">Add a project</h2>
        <p className="mt-1 text-xs text-slate-500">
          The {plan} plan allows {planLimit} project{planLimit === 1 ? "" : "s"}.
        </p>

        {message && (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {message}
          </p>
        )}

        <form onSubmit={createProject} className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="project-name">
              Name
            </label>
            <input id="project-name" name="name" className="input" placeholder="Marketing site" required />
            {fields.name && <p className="field-error">{fields.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="project-domain">
              Domain
            </label>
            <input
              id="project-domain"
              name="domain"
              className="input"
              placeholder="app.acme.com"
              required
            />
            {fields.domain && <p className="field-error">{fields.domain}</p>}
          </div>
          <div>
            <label className="label" htmlFor="project-env">
              Environment
            </label>
            <select id="project-env" name="environment" className="input" defaultValue="production">
              <option value="production">Production</option>
              <option value="staging">Staging</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy || atLimit}>
            {atLimit ? "Plan limit reached" : busy ? "Creating…" : "Create project"}
          </button>
        </form>
      </aside>
    </div>
  );
}
