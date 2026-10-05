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
        {/* Previous test loader — restore if needed.
        <script
          src="https://yash-loader-worker.pushkarnagwekar.workers.dev/boot?d=lumenfullnext.onrender.com"
          data-api="https://app.pretasystems.com/v1/api"
          data-ctx-cookie="preta_ctx"
        ></script> */}
        {/* Same setup as saas_nextjs: preconnect, then config + loader as two plain tags.
            Order matters — config must execute before the loader bundle, so no async/defer.
            data-* attributes belong on the loader tag (read via document.currentScript). */}
        <link rel="preconnect" href="https://loader-v1.pretasystems.com" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://loader-v1.pretasystems.com/config?d=lumenfullnext.onrender.com"></script>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src="https://loader-v1.pretasystems.com/l/pretaloader.js?d=lumenfullnext.onrender.com"
          data-api="https://app.pretasystems.com/v1/api"
          data-ctx-cookie="preta_ctx"
          data-debug="true"
        ></script>
      </head>
      <body className="min-h-screen">
        {/* App-shell wrapper the loader keys off for banner layout (App Router has no #__next). */}
        <div id="__next">{children}</div>
      </body>
    </html>
  );
}
