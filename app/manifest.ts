import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "@/constants/brand";
import { SITE_CONFIG } from "@/constants/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_CONFIG.name,
    short_name: "ZOLANZO",
    description: SITE_CONFIG.description,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.background,
    theme_color: BRAND_COLORS.primaryNavy,
    orientation: "portrait-primary",
    icons: [
      {
        src: "/brand/icon.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/brand/icon.webp",
        sizes: "192x192",
        type: "image/webp",
        purpose: "maskable",
      },
    ],
  };
}
