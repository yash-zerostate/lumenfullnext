"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setBusy(false);
    // Refresh so every Server Component re-reads the (now absent) session.
    startTransition(() => {
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={handleLogout} disabled={busy || pending} className="btn-ghost">
      {busy || pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
