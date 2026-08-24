/**
 * Which campaigns earners may discover. Matches existing CampaignVisibility.
 */

export const MARKETPLACE_VISIBILITIES = ["platform", "public"] as const;

export type MarketplaceVisibility = (typeof MARKETPLACE_VISIBILITIES)[number];

export function isMarketplaceVisibleCampaign(params: {
  status: string;
  visibility: string;
}): boolean {
  if (params.status !== "active") return false;
  return (MARKETPLACE_VISIBILITIES as readonly string[]).includes(
    params.visibility,
  );
}
