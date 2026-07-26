/**
 * Brand configuration — re-exports constants for config surface.
 */

import { BRAND, BRAND_ASSETS, BRAND_COLORS } from "@/constants/brand";

export const BRAND_CONFIG = {
  ...BRAND,
  colors: BRAND_COLORS,
  assets: BRAND_ASSETS,
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
