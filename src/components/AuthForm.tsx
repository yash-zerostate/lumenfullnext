"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PLAN_OPTIONS, RISK_SCORE_OPTIONS, ROLE_OPTIONS } from "@/lib/validation";

type Mode = "login" | "signup";

type ApiError = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFields({});
    setFormError(null);
    setSubmitting(true);

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = payload as ApiError;
        setFields(error.error?.fields ?? {});
        setFormError(error.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      // Cookies are already set by the response; refresh so Server Components
      // re-render with the new session before we navigate.
      router.replace(next);
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Is it running on port 4001?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {formError}
        </p>
      )}

      <div>
        <label className="label" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          required
        />
        {fields.email && <p className="field-error">{fields.email}</p>}
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
        {fields.password && <p className="field-error">{fields.password}</p>}
      </div>

      {mode === "signup" && (
        <>
          <div>
            <label className="label" htmlFor="name">
              Full name <span className="normal-case text-slate-600">(optional)</span>
            </label>
            <input id="name" name="name" className="input" autoComplete="name" />
            {fields.name && <p className="field-error">{fields.name}</p>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-ink-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Profile attributes
            </p>
            <p className="mt-1 text-xs text-slate-500">
              All optional — pick any combination to create a test account with those attributes.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="plan">
                  Plan
                </label>
                <select id="plan" name="plan" className="input" defaultValue="free">
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
                {fields.plan && <p className="field-error">{fields.plan}</p>}
              </div>

              <div>
                <label className="label" htmlFor="role">
                  Role
                </label>
                <select id="role" name="role" className="input" defaultValue="developer">
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {fields.role && <p className="field-error">{fields.role}</p>}
              </div>

              <div>
                <label className="label" htmlFor="riskScore">
                  Risk score
                </label>
                <select id="riskScore" name="riskScore" className="input" defaultValue="1">
                  {RISK_SCORE_OPTIONS.map((score) => (
                    <option key={score} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
                {fields.riskScore && <p className="field-error">{fields.riskScore}</p>}
              </div>

              <div>
                <label className="label" htmlFor="active">
                  Active
                </label>
                <select id="active" name="active" className="input" defaultValue="yes">
                  <option value="yes">yes</option>
                  <option value="no">no</option>
                </select>
                {fields.active && <p className="field-error">{fields.active}</p>}
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              These travel in the signed session token. <span className="text-slate-300">active</span>{" "}
              is an attribute like any other here — it does not block signing in.
            </p>
          </div>
        </>
      )}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting
          ? mode === "login"
            ? "Signing in…"
            : "Creating account…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
