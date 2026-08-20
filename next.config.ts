import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Pin Turbopack to this project (parent dirs may contain other lockfiles)
  turbopack: {
    root: process.cwd(),
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "motion",
      "@hugeicons/react",
      "@hugeicons/core-free-icons",
    ],
  },

  headers: async () => [
    {
      source: "/(.*)",
      headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
        key,
        value,
      })),
    },
    {
      source: "/brand/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

export default nextConfig;
