/**
 * Phase 4.1B — AI Match Engine types.
 * Recommendations only — never assigns workers.
 */

export type MatchCampaignContext = {
  campaignId: string;
  publicId: string;
  organizationId: string;
  name: string;
  category: string;
  status: string;
  countryScope: string[];
  languageScope: string[];
  deviceScope: string[];
  requiredSkills: string[];
  rewardPerUnitMinor: number;
  budgetMinor: number;
  currency: string;
  targetQuantity: number;
  /** Template + campaign merged constraints (JSON-compatible) */
  constraints: Array<{
    id: string;
    kind: string;
    op: string;
    params: Record<string, unknown>;
    enforcement: "hard" | "soft";
    label?: string;
  }>;
};

/**
 * Objective signals gathered for one worker candidate.
 * Missing fields use safe defaults in the score builder.
 */
export type WorkerMatchSignals = {
  workerId: string;
  workerPublicId: string | null;
  displayName: string | null;
  countryCode: string | null;
  /** State / region label when known */
  region: string | null;
  languages: string[];
  skills: string[];
  platforms: string[];
  organizationIds: string[];
  /** 0–100 */
  trustScore: number;
  /** Passport badge codes (metadata only — from Trust Passport) */
  trustBadges: string[];
  identityVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  /** 0–1 */
  completionRate: number;
  /** 0–1 */
  approvalRate: number;
  completedTasks: number;
  similarCampaignCompletions: number;
  activeAssignments: number;
  /** Estimated remaining capacity (assignments) */
  capacityRemaining: number;
  /** Hours since last activity; null = unknown */
  hoursSinceLastActivity: number | null;
  /** Approx response speed score 0–100 */
  responseSpeedScore: number;
  /** Org-specific completed assignments for this campaign's org */
  organizationHistoryCount: number;
  /** Expected payout for this campaign (minor units) */
  expectedPayoutMinor: number;
  /** Account age in days */
  accountAgeDays: number;
  /** Soft distance proxy: 0 same country, 1 unknown/far */
  distanceScore: number;
};

export type ScoreContribution = {
  code: string;
  label: string;
  /** Points contributed (can be negative) */
  delta: number;
  /** Raw signal value for debug */
  signal?: number | string | boolean | null;
};

export type WorkerScoreBreakdown = {
  workerId: string;
  ruleScore: number;
  contributions: ScoreContribution[];
  warnings: string[];
};

export type MatchReasonDetail = {
  code: string;
  label: string;
  delta: number;
};

export type MatchRecommendationLabel =
  | "highly_recommended"
  | "recommended"
  | "consider"
  | "low_fit";

export type WorkerMatchRecommendation = {
  workerId: string;
  workerPublicId: string | null;
  displayName: string | null;
  matchScore: number;
  ruleScore: number;
  /** 0–1 when AI augment ran; null when AI disabled */
  aiConfidence: number | null;
  confidence: number;
  reasons: string[];
  reasonDetails: MatchReasonDetail[];
  warnings: string[];
  label: MatchRecommendationLabel;
};

export type FairnessPolicy = {
  /** 0–1 — dampens top-heavy score dominance */
  diversityFactor: number;
  /** Flat boost for workers with few completions */
  newWorkerBoost: number;
  /** Boost when worker has history with the organization */
  organizationPreferenceBoost: number;
  /** Prefer spreading across regions when scores are close */
  regionalBalance: boolean;
  /** Down-rank workers recently recommended / high recent assignment volume */
  opportunityRotation: boolean;
  /** Soft penalty per active assignment beyond 1 */
  workloadPenaltyPerActive: number;
};

export const DEFAULT_FAIRNESS_POLICY: FairnessPolicy = {
  diversityFactor: 0.12,
  newWorkerBoost: 8,
  organizationPreferenceBoost: 12,
  regionalBalance: true,
  opportunityRotation: true,
  workloadPenaltyPerActive: 4,
};

export type RankingHealthCounters = {
  requests: number;
  failures: number;
  totalLatencyMs: number;
  totalScore: number;
  scoredWorkers: number;
  fallbackCount: number;
  aiAugmentCount: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
};
