/**
 * Work Opportunity — worker-facing view of an available Task Instance.
 */

export type WorkOpportunity = {
  /** Task Instance public id (TSK-…) — inventory handle, not shown as "Task #n" in UI copy */
  instancePublicId: string;
  instanceId: string;
  campaignPublicId: string;
  campaignId: string;
  /** Human opportunity title (campaign name) */
  title: string;
  /** Worker-facing category label */
  category: string;
  description: string;
  objective: string;
  rewardPerUnitMinor: number;
  currency: string;
  priority: string;
  estimatedDurationMin: number | null;
  templatePublicId: string;
  templateName: string;
  templateVersion: number;
  countryScope: string[];
  languageScope: string[];
  deviceScope: string[];
  createdAt: string;
};

export type MarketplaceSort =
  | "newest"
  | "oldest"
  | "reward_desc"
  | "reward_asc"
  | "priority";

export type MarketplacePage = {
  items: WorkOpportunity[];
  nextCursor: string | null;
  totalAvailable: number;
};

export type MarketplaceAnalytics = {
  available: number;
  reserved: number;
  claimed: number;
  claimRate: number;
  reservationTimeoutRate: number;
  reservationsTotal: number;
  reservationsExpired: number;
  reservationsConverted: number;
};
