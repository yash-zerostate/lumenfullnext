"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SessionUser } from "@/lib/auth/session";
import { PLAN_OPTIONS, RISK_SCORE_OPTIONS, ROLE_OPTIONS } from "@/lib/validation";

export function ProfileForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [plan, setPlan] = useState<SessionUser["plan"]>(user.plan);
  const [role, setRole] = useState<SessionUser["role"]>(user.role);
  const [riskScore, setRiskScore] = useState(String(user.riskScore));
  const [active, setActive] = useState<"yes" | "no">(user.active ? "yes" : "no");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    setFields({});
    setBusy(true);

    const response = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan, role, riskScore, active }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setFields(payload?.error?.fields ?? {});
      setStatus({ kind: "error", text: payload?.error?.message ?? "Could not save." });
      return;
    }

    setStatus({ kind: "ok", text: "Profile updated." });
    // Re-render the server tree so the header and dashboard pick up the change.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {status && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            status.kind === "ok"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {status.text}
        </p>
      )}

      <div>
        <label className="label" htmlFor="name">
          Display name
        </label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        {fields.name && <p className="field-error">{fields.name}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="plan">
            Plan
          </label>
          <select
            id="plan"
            className="input"
            value={plan}
            onChange={(event) => setPlan(event.target.value as SessionUser["plan"])}
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value as SessionUser["role"])}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="riskScore">
            Risk score
          </label>
          <select
            id="riskScore"
            className="input"
            value={riskScore}
            onChange={(event) => setRiskScore(event.target.value)}
          >
            {RISK_SCORE_OPTIONS.map((score) => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="active">
            Active
          </label>
          <select
            id="active"
            className="input"
            value={active}
            onChange={(event) => setActive(event.target.value as "yes" | "no")}
          >
            <option value="yes">yes</option>
            <option value="no">no</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Editing your own plan and risk score is a demo affordance — a real product takes these from
        billing and a scoring service. Here it lets you flip an account&rsquo;s attributes without
        registering a new one. Plan still decides how many projects you may keep.
      </p>

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
