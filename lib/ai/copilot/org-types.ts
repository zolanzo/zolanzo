/**
 * Phase 4.1E — Organization Copilot types.
 * Advisory only — never performs actions or mutates domain data.
 */

export type OrgCopilotIntent =
  | "campaign_performance"
  | "campaigns_behind_schedule"
  | "top_workers"
  | "reviewer_workload"
  | "pending_payments"
  | "fraud_trends"
  | "completion_rates"
  | "regional_performance"
  | "organization_spending"
  | "assignment_backlog"
  | "inactive_workers"
  | "highest_trust_workers"
  | "declining_trust"
  | "recently_improved_trust"
  | "strongest_reliability"
  | "follow_up"
  | "unknown";

export type OrgCopilotRecommendation = {
  code: string;
  label: string;
  /** Link hint to existing workflow — never executed */
  workflowHint: string;
};

export type OrgCampaignFact = {
  id: string;
  publicId: string;
  name: string;
  status: string;
  targetQuantity: number;
  completedQuantity: number;
  approvedQuantity: number;
  rejectedQuantity: number;
  budgetMinor: number;
  spentBudgetMinor: number;
  countryScope: string[];
  /** ISO date when campaign ends, if known */
  endAt: string | null;
};

export type OrgWorkerFact = {
  userId: string;
  displayName: string;
  completedTasks: number;
  approvalRate: number;
  activeAssignments: number;
  lastActivityAt: string | null;
  trustScore: number | null;
  trustTrend: string | null;
  reliabilityScore: number | null;
};

export type OrgReviewerFact = {
  userId: string;
  displayName: string;
  pendingQueue: number;
  assignedCount: number;
};

export type OrgPaymentFact = {
  publicId: string;
  status: string;
  amountMinor: number;
  createdAt: string;
};

export type OrgFraudTrendFact = {
  campaignId: string;
  campaignName: string;
  highRiskCount: number;
  avgRiskScore: number;
};

/** Frozen org facts for retrieval — loaded by service or injected in tests. */
export type OrgKnowledgeFacts = {
  organizationId: string;
  organizationName: string;
  campaigns: OrgCampaignFact[];
  workers: OrgWorkerFact[];
  reviewers: OrgReviewerFact[];
  payments: OrgPaymentFact[];
  fraudTrends: OrgFraudTrendFact[];
  spendingThisQuarterMinor: number;
  currency: string;
  frozenAt: string;
};

export type OrgCopilotResponse = {
  answer: string;
  confidence: number;
  intent: OrgCopilotIntent;
  dataSources: string[];
  keyFindings: string[];
  recommendations: OrgCopilotRecommendation[];
  suggestedFollowUps: string[];
  citations: string[];
  aiAugmented: boolean;
  fallbackUsed: boolean;
  advisoryOnly: true;
  modelVersion: string;
  latencyMs: number;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostMicroUsd: number;
};

export type OrgCopilotHealthCounters = {
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
  intentCounts: Partial<Record<OrgCopilotIntent, number>>;
};

export const ORG_COPILOT_MODEL_VERSION = "org-copilot/1.0.0";
