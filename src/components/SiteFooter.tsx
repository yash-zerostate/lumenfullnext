export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/5 py-10">
      <div className="container-page flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Lumen Analytics. A demo application.</p>
        <p>Next.js app and API on a single origin — localhost:4001</p>
      </div>
    </footer>
  );
}
