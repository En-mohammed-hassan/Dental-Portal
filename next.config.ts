import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for faster API responses
  compress: true,
  // Optimize for production
  poweredByHeader: false,
  // Enable response caching headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
