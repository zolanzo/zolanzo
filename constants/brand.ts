/**
 * ZOLANZO brand identity constants.
 * Color values follow the live semantic tokens in constants/design-tokens.ts.
 */

import { COLOR } from "@/constants/design-tokens";

export const BRAND = {
  name: "ZOLANZO",
  tagline: "Premium workforce marketplace for digital work",
  description:
    "Hire real people for app testing, AI data tasks, research, community growth, and more.",
  url: "https://zolanzo.com",
} as const;

export const BRAND_COLORS = {
  primaryNavy: COLOR.navy,
  primary: COLOR.primary,
  primaryTeal: COLOR.primary,
  darkTeal: COLOR.primaryHover,
  accentGold: COLOR.gold,
  background: COLOR.lightBackground,
  darkBackground: COLOR.darkBackground,
  darkSurface: COLOR.darkSurface,
  darkCard: COLOR.darkCard,
  success: COLOR.success,
  warning: COLOR.warning,
  danger: COLOR.danger,
} as const;

export const BRAND_ASSETS = {
  logo: {
    webp: "/brand/dark-theme-logo.webp",
    alt: "ZOLANZO logo",
  },
  icon: {
    webp: "/brand/icon.webp",
    alt: "ZOLANZO icon",
  },
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSETS;
