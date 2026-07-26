/**
 * Campaign Engine types — business contract, not tasks.
 */

import type { ClaimPolicyRule } from "@/constants/claim-policies";
import type { TemplateConstraint } from "@/constants/constraints";
import type { GenerationStrategy } from "@/constants/generation-strategies";
import type {
  GenerationPolicy,
  GenerationPolicyConfig,
} from "@/constants/generation-policies";
import type { ScheduleMode } from "@/constants/campaign-schedule";
import type { CampaignStatus } from "@/constants/work-states";
import type { RewardStrategyDefinition } from "@/constants/reward-strategies";
import type { BudgetModelKind } from "@/features/campaigns/services/budget-engine";

export type CampaignVisibility =
  | "private"
  | "organization"
  | "platform"
  | "public";

export type CampaignPriority = "low" | "normal" | "high" | "urgent";

/**
 * Human intent for the campaign — separate from Task Template mechanics.
 */
export type CampaignBrief = {
  businessObjective: string;
  successMetrics: string[];
  workerInstructions: string;
  qualityExpectations: string;
  acceptableExamples: string[];
  unacceptableExamples: string[];
  reviewerGuidance: string;
};

export type GenerationConfig = {
  batchSize?: number;
  intervalMinutes?: number;
  sourceKey?: string;
  allowExternalCreate?: boolean;
};

export type CampaignPayload = {
  name: string;
  slug: string;
  description: string;
  objective: string;
  visibility: CampaignVisibility;
  priority: CampaignPriority;
  category: string;
  tags: string[];
  brief: CampaignBrief;
  generationStrategy: GenerationStrategy;
  generationConfig?: GenerationConfig | null;
  generationPolicy: GenerationPolicy;
  generationPolicyConfig?: GenerationPolicyConfig | null;
  targetQuantity: number;
  budgetKind: BudgetModelKind;
  currency: string;
  /** Required when budgetKind=fixed */
  budgetMinor?: number;
  rewardPerUnitMinor: number;
  rewardStrategyOverride?: RewardStrategyDefinition | null;
  countryScope: string[];
  languageScope: string[];
  deviceScope: string[];
  audienceConstraints: TemplateConstraint[];
  claimPolicies: ClaimPolicyRule[];
  reservationTimeoutSeconds: number;
  scheduleMode: ScheduleMode;
  timezone: string;
  startAt?: string | null;
  endAt?: string | null;
  recurrenceRule?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CampaignRecord = CampaignPayload & {
  id: string;
  publicId: string;
  organizationId: string;
  clientUserId: string;
  taskTemplateId: string;
  status: CampaignStatus;
  completedQuantity: number;
  approvedQuantity: number;
  rejectedQuantity: number;
  budgetMinor: number;
  reservedBudgetMinor: number;
  spentBudgetMinor: number;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  clonedFromId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrgEligibilityPolicy = {
  constraints: TemplateConstraint[];
};
