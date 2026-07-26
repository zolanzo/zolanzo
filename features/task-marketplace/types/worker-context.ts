/**
 * Worker context for marketplace eligibility evaluation.
 */

export type WorkerEligibilityContext = {
  userId: string;
  countryCode: string | null;
  languages: string[];
  skills: string[];
  platforms: string[];
  devices: string[];
  trustScore: number;
  approvalRate: number;
  completedTasks: number;
  organizationIds: string[];
  /** Present when claiming invite-only work */
  inviteToken?: string | null;
};

export type EligibilityFailure = {
  constraintId: string;
  reason: string;
  enforcement: "hard" | "soft";
};

export type EligibilityEvaluation = {
  eligible: boolean;
  hardFailures: EligibilityFailure[];
  softWarnings: EligibilityFailure[];
};
