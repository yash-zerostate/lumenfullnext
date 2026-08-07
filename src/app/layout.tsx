import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lumen Analytics — product analytics without the guesswork",
    template: "%s · Lumen Analytics",
  },
  description:
    "Lumen Analytics turns raw product events into the three or four numbers your team actually acts on.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preta loader. The signed context JWT travels in the `preta_ctx` cookie
            (set at login, refreshed with every access token), so this layout reads
            no cookies itself — which is what lets pages stay statically rendered. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src="https://yash-loader-worker.pushkarnagwekar.workers.dev/boot?d=lumenfullnext.onrender.com"
          data-api="https://app.pretasystems.com/v1/api"
          data-ctx-cookie="preta_ctx"
        ></script>
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
