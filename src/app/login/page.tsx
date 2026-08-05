import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionClaims } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

function safeNext(value: string | undefined): string {
  // Never redirect off-site based on a query parameter.
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  if (await getSessionClaims()) redirect(next);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={null} />

      <main className="container-page flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="card">
            <h1 className="text-xl font-semibold text-white">Sign in to Lumen</h1>
            <p className="mt-1 text-sm text-slate-400">
              Use the seeded account <code className="text-slate-300">pro@example.com</code> /{" "}
              <code className="text-slate-300">Password123!</code> to look around.
            </p>

            {params.reason === "session_expired" && (
              <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Your session expired. Please sign in again.
              </p>
            )}

            <div className="mt-6">
              <AuthForm mode="login" next={next} />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            No account?{" "}
            <Link href="/signup" className="text-brand-400 hover:text-brand-300">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
