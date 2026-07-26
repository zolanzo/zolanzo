/**
 * ZOLANZO brand identity constants.
 * Single source of truth for colors, typography, and asset paths.
 */

export const BRAND = {
  name: "ZOLANZO",
  tagline: "Premium workforce marketplace for digital work",
  description:
    "Hire real people for app testing, AI data tasks, research, community growth, and more.",
  url: "https://zolanzo.com",
} as const;

export const BRAND_COLORS = {
  primaryNavy: "#071B34",
  primaryTeal: "#16C6C6",
  darkTeal: "#0FA5A5",
  accentGold: "#F6B81A",
  background: "#F8FAFC",
  darkBackground: "#081320",
  darkSurface: "#0F1E33",
  darkCard: "#152540",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export const BRAND_ASSETS = {
  logo: {
    webp: "/brand/logo.webp",
    png: "/brand/logo.png",
    alt: "ZOLANZO logo",
  },
  icon: {
    webp: "/brand/icon.webp",
    png: "/brand/icon.png",
    alt: "ZOLANZO icon",
  },
  appIcon: {
    webp: "/brand/app-icon.webp",
    png: "/brand/app-icon.png",
    alt: "ZOLANZO app icon",
  },
  favicon: {
    webp: "/brand/favicon.webp",
    png: "/brand/favicon.png",
    alt: "ZOLANZO favicon",
  },
  monochrome: {
    webp: "/brand/monochrome.webp",
    png: "/brand/monochrome.png",
    alt: "ZOLANZO monochrome mark",
  },
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;
