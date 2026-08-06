import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.0.205",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "127.0.0.1:3000",
        "localhost:3000",
        "192.168.0.205:3000",
      ],
    },
  },
};

export default nextConfig;
