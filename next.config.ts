import type { NextConfig } from "next";

const configuredDevOrigin = process.env.HOMEBACK_DEV_ORIGIN?.trim();
const devOrigin = configuredDevOrigin ? new URL(configuredDevOrigin) : null;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", devOrigin?.hostname].filter(
    (origin): origin is string => Boolean(origin),
  ),
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1:3000", "localhost:3000", devOrigin?.host].filter(
        (origin): origin is string => Boolean(origin),
      ),
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
