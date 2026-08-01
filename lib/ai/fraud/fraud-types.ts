/**
 * Phase 4.1C — AI Fraud Detection types.
 * Advisory only — never approves, rejects, or mutates domain state.
 */

export type FraudRiskLevel = "low" | "medium" | "high" | "critical";

export type FraudSuggestedAction =
  | "review_evidence"
  | "request_clarification"
  | "escalate"
  | "verify_identity"
  | "check_duplicates"
  | "validate_location";

export type FraudEvidenceItemSnapshot = {
  id: string;
  kind: string;
  label: string;
  contentHash: string | null;
  sizeBytes: number | null;
  replacedAt: string | null;
};

export type FraudGpsSnapshot = {
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  capturedAt: string | null;
};

export type FraudDeviceSnapshot = {
  fingerprint: string | null;
  platform: string | null;
  model: string | null;
};

export type FraudTimingSnapshot = {
  timeSpentSeconds: number | null;
  submittedAt: string | null;
  readyAt: string | null;
  createdAt: string | null;
};

/**
 * Frozen evidence bundle for risk evaluation.
 * Built by EvidenceCollector (pure) or loaded via FraudAssessmentService.
 */
export type FraudEvidenceBundle = {
  submissionId: string;
  submissionPublicId: string | null;
  organizationId: string | null;
  campaignId: string | null;
  workerUserId: string;
  status: string;
  requiredEvidenceKinds: string[];
  evidenceItems: FraudEvidenceItemSnapshot[];
  gps: FraudGpsSnapshot | null;
  device: FraudDeviceSnapshot | null;
  timing: FraudTimingSnapshot;
  /** Campaign geofence / country scope for boundary checks */
  campaignCountryScope: string[];
  campaignCenter: { lat: number; lng: number } | null;
  campaignRadiusKm: number | null;
  workerCountryCode: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  /** Prior rejection rate 0–1 for this worker */
  historicalRejectionRate: number;
  /** Prior fraud-flagged assessments count (if known) */
  priorFraudIndicators: number;
  /** Other submissions sharing same content hash */
  duplicateHashMatches: number;
  /** Other workers sharing same device fingerprint */
  sharedDeviceAccountCount: number;
  /** Submissions by same worker in last hour */
  recentSubmissionBurst: number;
  /** Optional free-text / narrative for AI analyzer */
  narrativeText: string | null;
  /** Previous GPS for travel-speed check */
  previousGps: FraudGpsSnapshot | null;
  previousSubmittedAt: string | null;
};

export type FraudRiskFinding = {
  code: string;
  label: string;
  /** Points contributed to risk score (positive = more risk) */
  delta: number;
  severity: "low" | "medium" | "high";
  source: "rule" | "ai";
  signal?: number | string | boolean | null;
};

export type FraudAssessment = {
  submissionId: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  confidence: number;
  reasons: string[];
  reasonDetails: FraudRiskFinding[];
  warnings: string[];
  suggestedActions: FraudSuggestedAction[];
  ruleScore: number;
  aiAugmented: boolean;
  fallbackUsed: boolean;
  advisoryOnly: true;
  modelVersion: string;
  latencyMs: number;
};

export type FraudHealthCounters = {
  requests: number;
  failures: number;
  totalLatencyMs: number;
  totalScore: number;
  assessments: number;
  highRiskCount: number;
  aiAugmentCount: number;
  ruleOnlyCount: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  /** Placeholder until reviewer feedback loop exists */
  falsePositiveReviews: number;
  confirmedFraudReviews: number;
};

export const FRAUD_ENGINE_MODEL_VERSION = "fraud-engine/1.0.0";
