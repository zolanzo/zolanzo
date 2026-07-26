/**
 * Task Template domain types (production).
 */

import type { WorkCapability } from "@/constants/work-capabilities";
import type { EvidenceKind } from "@/constants/work-capabilities";
import type { TemplateConstraint } from "@/constants/constraints";
import type { RewardStrategyDefinition } from "@/constants/reward-strategies";
import type { ReviewRulesDefinition } from "@/constants/review-rules";
import type { ValidationRuleDefinition } from "@/constants/validation-rules";

export type TemplateStepDefinition = {
  key: string;
  capability: WorkCapability;
  instruction: string;
  required: boolean;
  config?: Record<string, unknown>;
};

export type EvidenceRequirement = {
  kind: EvidenceKind;
  stepKey?: string;
  required: boolean;
  minCount?: number;
  maxCount?: number;
};

export type SubmissionSchemaDefinition = {
  type: "object";
  /** JSON-schema-like properties map (lightweight) */
  properties: Record<string, unknown>;
  required?: string[];
};

export type TaskTemplatePayload = {
  templateKey: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string | null;
  difficulty: "easy" | "medium" | "hard" | "expert";
  estimatedDurationMin?: number | null;
  capabilitySet: TemplateStepDefinition[];
  requiredEvidence: EvidenceRequirement[];
  submissionSchema: SubmissionSchemaDefinition;
  validationRules: ValidationRuleDefinition;
  reviewRules: ReviewRulesDefinition;
  rewardStrategy: RewardStrategyDefinition;
  constraints: TemplateConstraint[];
  supportedPlatforms: string[];
  supportedDevices: string[];
  supportedCountries: string[];
  supportedLanguages: string[];
  requiredSkills: string[];
  visibility: "private" | "organization" | "platform" | "public";
  metadata?: Record<string, unknown> | null;
};

export type TaskTemplateRecord = TaskTemplatePayload & {
  id: string;
  publicId: string;
  version: number;
  status: "draft" | "published" | "archived";
  createdByUserId: string | null;
  updatedByUserId: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  previousVersionId: string | null;
  createdAt: string;
  updatedAt: string;
};
