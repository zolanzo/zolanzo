/**
 * Phase 4.1F — Worker Copilot types.
 * Advisory only — never performs actions or mutates domain data.
 * Worker-scoped: never exposes other workers or org-private data.
 */

export type WorkerCopilotIntent =
  | "my_assignments"
  | "next_best_task"
  | "highest_pay_today"
  | "nearby_work"
  | "deadlines"
  | "submission_status"
  | "missing_evidence"
  | "rejection_reason"
  | "approval_history"
  | "trust_score"
  | "weekly_earnings"
  | "payment_history"
  | "assignment_coach"
  | "progress"
  | "improvement_tips"
  | "follow_up"
  | "unknown";

export type WorkerCopilotRecommendation = {
  code: string;
  label: string;
  reason: string;
  estimatedPayoutMinor?: number | null;
  confidence: number;
  expectedApproval: "high" | "medium" | "low" | null;
  workflowHint: string;
};

export type WorkerAssignmentFact = {
  id: string;
  publicId: string;
  campaignPublicId: string;
  campaignName: string;
  status: string;
  rewardMinor: number;
  currency: string;
  expiresAt: string | null;
  progressPercent: number;
  requiredEvidenceKinds: string[];
  presentEvidenceKinds: string[];
  gpsRequired: boolean;
  gpsSatisfied: boolean | null;
  countryCode: string | null;
  /** Approximate distance proxy 0 = nearby / same region */
  distanceScore: number;
  submittedAt: string | null;
  lastRejectionReason: string | null;
};

export type WorkerSubmissionFact = {
  publicId: string;
  status: string;
  assignmentPublicId: string;
  submittedAt: string | null;
  reviewOutcome: string | null;
  missingEvidence: string[];
};

export type WorkerPaymentFact = {
  publicId: string;
  status: string;
  amountMinor: number;
  createdAt: string;
};

export type WorkerKnowledgeFacts = {
  workerUserId: string;
  displayName: string;
  trustScore: number;
  approvalRate: number;
  completedAssignments: number;
  earningsThisWeekMinor: number;
  currency: string;
  avgReviewHours: number | null;
  avgPaymentHours: number | null;
  assignments: WorkerAssignmentFact[];
  submissions: WorkerSubmissionFact[];
  payments: WorkerPaymentFact[];
  workerCountryCode: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustTrend: string | null;
  trustReasons: string[];
  trustWarnings: string[];
  trustLastEvents: Array<{
    eventType: string;
    occurredAt: string;
    decayedWeight: number;
  }>;
  frozenAt: string;
};

export type WorkerCopilotResponse = {
  answer: string;
  confidence: number;
  intent: WorkerCopilotIntent;
  dataSources: string[];
  keyFindings: string[];
  recommendations: WorkerCopilotRecommendation[];
  suggestedFollowUps: string[];
  citations: string[];
  assignmentCoach: string[] | null;
  progressSummary: string[] | null;
  aiAugmented: boolean;
  fallbackUsed: boolean;
  advisoryOnly: true;
  modelVersion: string;
  latencyMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostMicroUsd: number;
};

export type WorkerCopilotHealthCounters = {
  requests: number;
  failures: number;
  totalLatencyMs: number;
  totalConfidence: number;
  answered: number;
  aiAugmentCount: number;
  ruleOnlyCount: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostMicroUsd: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  intentCounts: Partial<Record<WorkerCopilotIntent, number>>;
};

export const WORKER_COPILOT_MODEL_VERSION = "worker-copilot/1.0.0";
