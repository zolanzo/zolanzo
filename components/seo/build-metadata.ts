import type { Metadata } from "next";
import { SITE_CONFIG } from "@/constants/site";
import { BRAND_ASSETS } from "@/constants/brand";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

/**
 * Shared metadata builder for SEO-optimized pages.
 */
export function buildPageMetadata({
  title,
  description = SITE_CONFIG.description,
  path = "/",
  noIndex = false,
}: BuildMetadataInput = {}): Metadata {
  const pageTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`;

  const url = new URL(path, SITE_CONFIG.url).toString();

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      type: "website",
      images: [
        {
          url: BRAND_ASSETS.logo.webp,
          alt: BRAND_ASSETS.logo.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      creator: SITE_CONFIG.twitterHandle,
      images: [BRAND_ASSETS.logo.webp],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    icons: {
      icon: [{ url: "/brand/icon.webp", type: "image/webp" }],
      shortcut: [{ url: "/brand/icon.webp", type: "image/webp" }],
      apple: [{ url: "/brand/icon.webp", type: "image/webp" }],
    },
    manifest: "/manifest.webmanifest",
  };
}
