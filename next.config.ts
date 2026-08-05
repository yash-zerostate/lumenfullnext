import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // mongoose pulls in optional native deps it never uses in this app; keep it
  // out of the bundler and let Node require it at runtime.
  serverExternalPackages: ["mongoose", "bcryptjs"],
  poweredByHeader: false,
  // This app renders no images through next/image, and the optimizer pulls in
  // sharp/libvips — which is where every remaining advisory in `npm audit`
  // lives. Turning it off removes the dependency's attack surface entirely
  // rather than carrying a known-vulnerable path we never call.
  images: { unoptimized: true },
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
