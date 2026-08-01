/**
 * Phase 4.2A — Trust & Reputation types.
 * Trust is a platform capability — explainable, time-decayed, never bypasses domain services.
 */

export const TRUST_ENGINE_MODEL_VERSION = "trust-engine/1.1.0";

export type TrustSubjectType = "worker" | "organization" | "reviewer";

export type TrustDimension =
  | "identity"
  | "reliability"
  | "quality"
  | "behavior"
  | "experience"
  | "reputation";

export type TrustTrend = "improving" | "stable" | "declining" | "unknown";

export type TrustEventType =
  | "assignment_completed"
  | "assignment_expired"
  | "assignment_accepted"
  | "submission_approved"
  | "submission_rejected"
  | "submission_revision_requested"
  | "review_completed"
  | "payment_settled"
  | "fraud_confirmed"
  | "fraud_cleared"
  | "appeal_upheld"
  | "appeal_denied"
  | "appeal_resolved"
  | "identity_verified"
  | "email_verified"
  | "phone_verified"
  | "organization_endorsement"
  | "policy_violation"
  | "warning_issued"
  | "suspension"
  | "reinstatement"
  | "recalculation"
  | "bootstrap";

export type TrustEventStatus =
  | "pending"
  | "processed"
  | "failed"
  | "dead_letter"
  | "skipped";

/** Weighted contribution for time-decayed scoring. */
export type TrustWeightedEvent = {
  id: string;
  userId: string;
  type: TrustEventType;
  occurredAt: string;
  /** Pre-decay magnitude (−100…+100 style) */
  rawWeight: number;
  /** After time decay */
  decayedWeight: number;
  decayFactor: number;
  payload?: Record<string, unknown>;
};

/**
 * Frozen signal bundle for calculation (read from domain or event ledger).
 * Calculators never query live DB themselves.
 */
export type TrustSignalSnapshot = {
  userId: string;
  subjectKind: "worker" | "client" | "user" | "organization" | "reviewer";
  frozenAt: string;
  // Identity
  emailVerified: boolean;
  phoneVerified: boolean;
  governmentIdVerified: boolean;
  organizationVerified: boolean;
  addressVerified: boolean;
  // Reliability
  assignmentsTotal: number;
  assignmentsCompleted: number;
  assignmentsAccepted: number;
  assignmentsOffered: number;
  avgResponseHours: number | null;
  deadlineMetRate: number;
  attendanceRate: number;
  // Quality
  reviewsDecided: number;
  reviewsApproved: number;
  revisionRequestCount: number;
  avgReviewConfidence: number | null;
  positiveFeedbackCount: number;
  // Behavior
  fraudConfirmedCount: number;
  policyViolationCount: number;
  appealUpheldCount: number;
  appealDeniedCount: number;
  warningCount: number;
  suspensionCount: number;
  // Experience
  accountAgeDays: number;
  distinctCampaigns: number;
  distinctOrganizations: number;
  // Reputation
  organizationEndorsements: number;
  verifiedRecommendations: number;
  /** Optional prior overall for trend (null = first calc) */
  previousOverallScore: number | null;
  previousCalculatedAt: string | null;
  /** Decayed event contributions (optional enrichment) */
  weightedEvents: TrustWeightedEvent[];
};

export type TrustDimensionScore = {
  dimension: TrustDimension;
  score: number;
  weight: number;
  contributors: Array<{ code: string; label: string; delta: number }>;
};

export type TrustProfile = {
  userId: string;
  publicId: string;
  subjectKind: "worker" | "client" | "user" | "organization" | "reviewer";
  subjectType: TrustSubjectType;
  subjectId: string;
  overallScore: number;
  dimensions: Record<TrustDimension, number>;
  dimensionDetails: TrustDimensionScore[];
  trend: TrustTrend;
  trendDelta: number;
  reasons: string[];
  warnings: string[];
  lastInfluencingEvents: Array<{
    eventType: string;
    occurredAt: string;
    decayedWeight: number;
  }>;
  modelVersion: string;
  version: number;
  calculatedAt: string;
  lastEventAt: string | null;
  advisoryOnly: true;
};

export type TrustHealthCounters = {
  recalculations: number;
  eventsProcessed: number;
  eventsFailed: number;
  eventsDeadLetter: number;
  failures: number;
  totalLatencyMs: number;
  totalOverallScore: number;
  scoredProfiles: number;
  risingCount: number;
  fallingCount: number;
  newlyVerifiedIdentities: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  scoreBuckets: Record<string, number>;
};
