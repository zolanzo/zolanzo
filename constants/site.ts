import { BRAND } from "@/constants/brand";

export const SITE_CONFIG = {
  name: BRAND.name,
  tagline: BRAND.tagline,
  description: BRAND.description,
  url: process.env.NEXT_PUBLIC_APP_URL ?? BRAND.url,
  locale: "en_US",
  twitterHandle: "@zolanzo",
} as const;

export const WORKFORCE_CATEGORIES = [
  "App Testing",
  "Website Testing",
  "Google Play Testing",
  "App Store Testing",
  "AI Data Collection",
  "AI Image Labelling",
  "AI Voice Collection",
  "AI Audio Validation",
  "AI Translation",
  "Website Signups",
  "Survey Completion",
  "Product Reviews",
  "Research Tasks",
  "Lead Generation",
  "Social Campaigns",
  "Brand Awareness",
  "Community Growth",
  "Telegram Communities",
  "WhatsApp Communities",
  "Discord Communities",
  "LinkedIn Growth",
  "Reddit Campaigns",
  "YouTube Campaigns",
  "Influencer Tasks",
  "QA Testing",
  "Bug Reports",
  "Moderation",
  "Human Verification",
] as const;

export type WorkforceCategory = (typeof WORKFORCE_CATEGORIES)[number];
