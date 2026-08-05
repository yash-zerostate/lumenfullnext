import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pricing" };

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "One project, full feature set, 30-day retention.",
    features: ["1 project", "50k events / month", "30-day retention", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    cadence: "per month",
    blurb: "For teams shipping weekly and watching the numbers.",
    features: ["5 projects", "2M events / month", "12-month retention", "Slack alerts", "Email support"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "annual",
    blurb: "SSO, data residency and a named engineer.",
    features: ["50 projects", "Unlimited events", "Custom retention", "SAML SSO", "99.9% SLA"],
  },
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />

      <main className="flex-1">
        <section className="container-page py-16">
          <h1 className="text-3xl font-semibold text-white">Straightforward pricing</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-400">
            Every plan includes the full product. You are paying for volume, retention and support
            response time — not for features held back.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = user?.plan === plan.id;
              return (
                <article
                  key={plan.id}
                  className={`card flex flex-col ${
                    plan.highlight ? "border-brand-500/40 ring-1 ring-brand-500/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                    {isCurrent && <span className="badge">Your plan</span>}
                  </div>
                  <p className="mt-4">
                    <span className="text-3xl font-semibold text-white">{plan.price}</span>{" "}
                    <span className="text-xs text-slate-500">{plan.cadence}</span>
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{plan.blurb}</p>
                  <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="text-brand-400">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={user ? "/dashboard" : "/signup"}
                    className={`mt-6 ${plan.highlight ? "btn-primary" : "btn-ghost"}`}
                  >
                    {isCurrent ? "Manage plan" : user ? "Switch plan" : "Get started"}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
