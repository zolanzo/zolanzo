import type { BrandType } from "@/components/ui/brand-icons";

/**
 * Compact homepage preview of social platforms already offered in
 * earner preferences / marketplace filters. No rewards or counts —
 * live task data is not loaded on the public homepage.
 */
export const HOME_SOCIAL_PLATFORMS: readonly { brand: BrandType; label: string }[] = [
  { brand: "instagram", label: "Instagram" },
  { brand: "tiktok", label: "TikTok" },
  { brand: "facebook", label: "Facebook" },
  { brand: "x", label: "X" },
  { brand: "youtube", label: "YouTube" },
  { brand: "telegram", label: "Telegram" },
  { brand: "whatsapp", label: "WhatsApp" },
  { brand: "linkedin", label: "LinkedIn" },
];
