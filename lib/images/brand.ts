/**
 * Brand asset path helpers with WebP-only strategy.
 */

import { BRAND_ASSETS, type BrandAssetKey } from "@/constants/brand";

export type PictureSources = {
  webp: string;
  alt: string;
};

export function getBrandPicture(key: BrandAssetKey): PictureSources {
  return BRAND_ASSETS[key];
}

/**
 * Single source of truth WebP path for brand assets.
 */
export function getPreferredBrandSrc(key: BrandAssetKey): string {
  return BRAND_ASSETS[key].webp;
}

export function getBrandFallbackSrc(key: BrandAssetKey): string {
  return BRAND_ASSETS[key].webp;
}
