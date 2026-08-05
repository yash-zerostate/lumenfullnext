import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // mongoose pulls in optional native deps it never uses in this app; keep it
  // out of the bundler and let Node require it at runtime.
  serverExternalPackages: ["mongoose", "bcryptjs"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
