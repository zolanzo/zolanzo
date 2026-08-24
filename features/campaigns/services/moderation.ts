/**
 * Campaign moderation rules using the existing CampaignStatus set.
 * Does not invent a parallel status system.
 */

import type { CampaignStatus } from "@/constants/work-states";
import type { Role } from "@/constants/roles";
import { hasPlatformRole } from "@/lib/rbac/access";

/** Staff roles that may approve or reject marketplace campaigns. */
export const CAMPAIGN_MODERATION_ROLES: readonly Role[] = [
  "admin",
  "super_admin",
  "operations",
  "moderator",
];

export function canModerateMarketplaceCampaign(
  platformRoles: readonly Role[],
): boolean {
  return hasPlatformRole(platformRoles, [...CAMPAIGN_MODERATION_ROLES]);
}

/**
 * Publish / go-live is only valid after review (or from a scheduled hold).
 * Draft must not skip moderation.
 */
export function canPublishAfterModeration(status: CampaignStatus): boolean {
  return status === "pending_review" || status === "scheduled";
}

export function canRejectCampaignReview(status: CampaignStatus): boolean {
  return status === "pending_review";
}
