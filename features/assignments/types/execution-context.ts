/**
 * Immutable execution context frozen at Assignment creation.
 */

export type ExecutionContextEligibility = {
  eligible: boolean;
  hardFailureIds: string[];
  softWarningIds: string[];
};

export type ExecutionContextClaimPolicy = {
  allowed: boolean;
  errors: string[];
  deferred: string[];
  rulesApplied: string[];
};

export type ExecutionContext = {
  taskTemplateId: string;
  taskTemplateVersion: number;
  taskTemplatePublicId: string;
  campaignId: string;
  campaignPublicId: string;
  /** Campaign has no version column yet — use updatedAt ISO as revision marker */
  campaignRevisionAt: string;
  workerUserId: string;
  workerTrustScore: number | null;
  eligibility: ExecutionContextEligibility;
  claimPolicy: ExecutionContextClaimPolicy;
  device: {
    platforms: string[];
    devices: string[];
  };
  countryCode: string | null;
  languages: string[];
  activeOrganizationId: string | null;
  rewardSnapshot: {
    rewardPerUnitMinor: number;
    currency: string;
    strategyOverride: unknown | null;
  };
  capturedAt: string;
};
