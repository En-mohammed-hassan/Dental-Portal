import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

/** Always the Elkood app folder (where this file and node_modules live), not the parent `my-apps` folder. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    },
  },
  // Prevent Turbopack from bundling Prisma — otherwise delegates like `prisma.siteSettings` can be undefined at runtime
  serverExternalPackages: ["@prisma/client", "prisma", "@prisma/engines"],
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
