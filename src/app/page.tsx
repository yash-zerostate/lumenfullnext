import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Events that explain themselves",
    body: "Every event carries the plan, role and route it happened on, so a drop in activation is one filter away from an answer.",
  },
  {
    title: "Funnels you can trust",
    body: "Sessions are stitched server-side, so a refresh, a redirect or a mobile hand-off does not fork one user into three.",
  },
  {
    title: "Alerts before the standup",
    body: "Threshold and anomaly alerts run every five minutes and land in Slack with the segment already applied.",
  },
];

const METRICS = [
  { value: "1.2B", label: "events ingested / month" },
  { value: "480ms", label: "p95 query time" },
  { value: "99.98%", label: "ingest uptime" },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />

      <main className="flex-1">
        <section className="container-page pb-16 pt-20">
          <span className="badge">Product analytics</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Ship the change, then know within an hour whether it worked.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
            Lumen collects product events, stitches them into real sessions, and answers the four
            questions your team asks after every release — without a data engineer in the loop.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={user ? "/dashboard" : "/signup"} className="btn-primary">
              {user ? "Open dashboard" : "Start free — no card"}
            </Link>
            <Link href="/pricing" className="btn-ghost">
              See pricing
            </Link>
          </div>

          <dl className="mt-16 grid gap-4 sm:grid-cols-3">
            {METRICS.map((metric) => (
              <div key={metric.label} className="card">
                <dt className="text-2xl font-semibold text-white">{metric.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                  {metric.label}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="container-page py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="card">
                <h2 className="text-base font-semibold text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container-page py-16">
          <div className="card flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Your first project takes about four minutes.
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Create an account, add a domain, drop in the snippet. That is the whole setup.
              </p>
            </div>
            <Link href={user ? "/dashboard" : "/signup"} className="btn-primary shrink-0">
              {user ? "Go to dashboard" : "Create your account"}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
