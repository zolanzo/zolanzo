/**
 * Campaign lifecycle transitions.
 */

import type { CampaignStatus } from "@/constants/work-states";

const TRANSITIONS: Record<CampaignStatus, readonly CampaignStatus[]> = {
  draft: ["pending_review", "scheduled", "active", "cancelled", "archived"],
  pending_review: ["draft", "scheduled", "active", "cancelled"],
  scheduled: ["active", "paused", "cancelled", "draft"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled", "completed"],
  completed: ["archived"],
  cancelled: ["archived", "draft"],
  archived: [],
};

export function canTransitionCampaign(
  from: CampaignStatus,
  to: CampaignStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: CampaignStatus,
  to: CampaignStatus,
): void {
  if (!canTransitionCampaign(from, to)) {
    throw new Error(`Invalid campaign transition: ${from} → ${to}`);
  }
}

export function isEditableCampaignStatus(status: CampaignStatus): boolean {
  return status === "draft" || status === "pending_review";
}

export function isPublishableStatus(status: CampaignStatus): boolean {
  return status === "draft" || status === "pending_review" || status === "scheduled";
}
