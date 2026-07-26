/**
 * Brand asset path helpers with WebP-first strategy.
 */

import { BRAND_ASSETS, type BrandAssetKey } from "@/constants/brand";

export type PictureSources = {
  webp: string;
  png: string;
  alt: string;
};

export function getBrandPicture(key: BrandAssetKey): PictureSources {
  return BRAND_ASSETS[key];
}

/**
 * Prefer WebP for UI; PNG retained as progressive enhancement fallback.
 */
export function getPreferredBrandSrc(key: BrandAssetKey): string {
  return BRAND_ASSETS[key].webp;
}

export function getBrandFallbackSrc(key: BrandAssetKey): string {
  return BRAND_ASSETS[key].png;
}
