import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/ProfileForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const attributes: Array<[string, string]> = [
    ["Name", user.name],
    ["Email", user.email],
    ["Active", user.active ? "yes" : "no"],
    ["Plan", user.plan],
    ["Role", user.role],
    ["Risk score", String(user.riskScore)],
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />

      <main className="container-page flex-1 py-12">
        <h1 className="text-2xl font-semibold text-white">Your profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          These are the attributes carried in your signed session token.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="card h-fit">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Current values
            </h2>
            <dl className="mt-4 space-y-3">
              {attributes.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="truncate text-sm text-slate-100">{value}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="text-xs uppercase tracking-wider text-slate-500">User id</dt>
                <dd className="truncate font-mono text-xs text-slate-400">{user.id}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Edit
            </h2>
            <ProfileForm user={user} />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
