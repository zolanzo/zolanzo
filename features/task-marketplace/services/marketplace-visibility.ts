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

export function isOpportunityStartable(params: {
  instanceStatus: string;
  campaignStatus: string;
  viewerCanContinue?: boolean;
}): boolean {
  if (params.viewerCanContinue) return true;
  return (
    params.instanceStatus === "available" && params.campaignStatus === "active"
  );
}

/** Detail pages may show claimed inventory honestly; unpublished campaigns stay hidden. */
export function canViewWorkOpportunity(params: {
  campaignStatus: string;
  campaignVisibility: string;
  viewerCanContinue?: boolean;
}): boolean {
  if (params.viewerCanContinue) return true;
  return isMarketplaceVisibleCampaign({
    status: params.campaignStatus,
    visibility: params.campaignVisibility,
  });
}
