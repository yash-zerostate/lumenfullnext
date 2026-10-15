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
        {/* Preta SmartCode Start — Main loader (System-Dashboard, app.pretasystems.com/api). */}
        <script
          async
          src="https://loader.pretasystems.com/?d=lumenfullnext.onrender.com"
          data-api="https://app.pretasystems.com/api"
          data-debug="true"
        ></script>
        {/* Preta SmartCode End */}
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-P0LL1DLQKN"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-P0LL1DLQKN');
`,
          }}
        />
      </head>
      <body className="min-h-screen">
        {/* App-shell wrapper the loader keys off for banner layout (App Router has no #__next). */}
        <div id="__next">{children}</div>
      </body>
    </html>
  );
}
