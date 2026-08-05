"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiError;
        setFields(payload.error?.fields ?? {});
        setFormError(payload.error?.message ?? "Something went wrong. Please try again.");
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

      {mode === "signup" && (
        <>
          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input id="name" name="name" className="input" autoComplete="name" required />
            {fields.name && <p className="field-error">{fields.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="company">
              Company <span className="normal-case text-slate-600">(optional)</span>
            </label>
            <input id="company" name="company" className="input" autoComplete="organization" />
          </div>
        </>
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
        {mode === "signup" && !fields.password && (
          <p className="mt-1 text-xs text-slate-500">
            At least 10 characters, with an uppercase letter and a number.
          </p>
        )}
      </div>

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
