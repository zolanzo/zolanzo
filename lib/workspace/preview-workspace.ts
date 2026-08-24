import { DEFAULT_OPPORTUNITY_PREFERENCES } from "@/features/settings/types";
import type { DataBoundary } from "@/lib/workspace/data-boundary";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

/**
 * Structural empty workspaces for local UI. Not live records.
 * Never used when DataBoundary.kind is "live".
 */
export function createPreviewEarnerWorkspace(
  loadState: DataBoundary,
): EarnerWorkspace {
  if (loadState.kind === "live") {
    throw new Error("Preview earner workspace cannot be tagged as live data.");
  }
  if (loadState.kind === "fixture") {
    throw new Error("Earner preview workspace is empty, not a data fixture.");
  }

  return {
    userId: "",
    email: null,
    phone: null,
    emailVerified: false,
    phoneVerified: false,
    memberSince: "",
    workerPublicId: null,
    displayName: "",
    handle: "",
    avatarUrl: null,
    legalName: null,
    bio: null,
    countryCode: null,
    trustScore: null,
    wallet: {
      walletId: null,
      availableMinor: 0,
      pendingMinor: 0,
      heldMinor: 0,
      lifetimeEarnedMinor: 0,
      lifetimePaidMinor: 0,
      availableLabel: "",
      pendingLabel: "",
    },
    bank: null,
    transactions: [],
    withdrawals: [],
    opportunities: [],
    stats: {
      completedAssignments: 0,
      totalAssignments: 0,
      approvedSubmissions: 0,
      totalSubmissions: 0,
      approvalRate: null,
      completionRate: null,
    },
    verification: {
      email: false,
      phone: false,
      bank: false,
      identity: false,
    },
    preferences: { ...DEFAULT_OPPORTUNITY_PREFERENCES },
    marketingOptIn: false,
    referralUrl: "/signup",
    workItems: [],
    loadState,
  };
}

export function createPreviewHirerWorkspace(
  loadState: DataBoundary,
): HirerWorkspace {
  if (loadState.kind === "live") {
    throw new Error("Preview hirer workspace cannot be tagged as live data.");
  }
  if (loadState.kind === "fixture") {
    throw new Error("Hirer preview workspace is empty, not a data fixture.");
  }

  return {
    userId: "",
    displayName: "",
    handle: "",
    avatarUrl: null,
    organization: null,
    orgRole: null,
    wallet: {
      walletId: null,
      availableMinor: 0,
      pendingMinor: 0,
      heldMinor: 0,
      lifetimePaidMinor: 0,
      availableLabel: "",
      pendingLabel: "",
      heldLabel: "",
    },
    transactions: [],
    campaigns: [],
    pendingReviews: [],
    workers: [],
    members: [],
    invitations: [],
    templates: [],
    platformWorkerCount: 0,
    loadState,
  };
}
