import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionClaims } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  if (await getSessionClaims()) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={null} />

      <main className="container-page flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="card">
            <h1 className="text-xl font-semibold text-white">Create your account</h1>
            <p className="mt-1 text-sm text-slate-400">
              Free plan, one project, no card. Upgrade whenever you outgrow it.
            </p>
            <div className="mt-6">
              <AuthForm mode="signup" next="/dashboard" />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
