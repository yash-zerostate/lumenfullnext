import Link from "next/link";

import { LogoutButton } from "@/components/LogoutButton";
import type { SessionUser } from "@/lib/auth/session";

const NAV = [
  { href: "/", label: "Product" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-[13px] font-bold">
              L
            </span>
            Lumen
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-white">
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-xs text-slate-400 sm:inline">
                {user.email} · <span className="uppercase">{user.plan}</span>
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-300 transition hover:text-white">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
