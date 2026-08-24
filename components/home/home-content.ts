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

export const HOME_SUCCESS_STORIES = [
  { name: "Grace A.", city: "Lagos", country: "Nigeria", amount: "₦384,000 earned", text: "Reliable way to earn extra income each month after my main job.", joined: "Joined 2025", initial: "GA" },
  { name: "Samuel K.", city: "Accra", country: "Ghana", amount: "₦520,000 earned", text: "Work on AI data projects from anywhere while studying at university.", joined: "Joined 2025", initial: "SK" },
  { name: "Amina H.", city: "Abuja", country: "Nigeria", amount: "₦1.85M disbursed", text: "Recruited verified earners quickly for our mobile app launch campaign.", joined: "Verified Hirer", initial: "AH" },
  { name: "Kofi M.", city: "Kumasi", country: "Ghana", amount: "₦640,000 earned", text: "Completed over 1,500 survey microtasks during my free time.", joined: "Top Earner", initial: "KM" },
  { name: "Zainab B.", city: "Kano", country: "Nigeria", amount: "₦1.45M disbursed", text: "Hired top remote chat support earners for our e-commerce business.", joined: "Verified Hirer", initial: "ZB" },
  { name: "Tariq S.", city: "Nairobi", country: "Kenya", amount: "₦720,000 earned", text: "Highest quality digital work platform in Africa.", joined: "Top Earner", initial: "TS" },
] as const;
