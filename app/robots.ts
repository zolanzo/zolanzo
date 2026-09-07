import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/constants/site";

/**
 * Public marketing pages stay crawlable. Authenticated product areas,
 * APIs, and auth completion flows are kept out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/app",
        "/earner",
        "/hirer",
        "/lex",
        "/admin",
        "/developer",
        "/onboarding",
        "/dashboard",
        "/profile",
        "/settings",
        "/wallet",
        "/tasks",
        "/applications",
        "/activity",
        "/referrals",
        "/notifications",
        "/support",
        "/submissions",
        "/welcome",
        "/auth",
        "/dev",
        "/design-system",
      ],
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
