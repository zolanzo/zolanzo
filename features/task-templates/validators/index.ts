import { z } from "zod";
import { WORK_CAPABILITIES } from "@/constants/work-capabilities";
import { EVIDENCE_KINDS } from "@/constants/work-capabilities";
import { CONSTRAINT_KINDS } from "@/constants/constraints";
import { REVIEW_ACTIONS } from "@/constants/review-rules";
import { VALIDATION_MODES } from "@/constants/work-states";

const capabilitySchema = z.enum(
  WORK_CAPABILITIES as unknown as [string, ...string[]],
);
const evidenceKindSchema = z.enum(
  EVIDENCE_KINDS as unknown as [string, ...string[]],
);

export const templateStepSchema = z.object({
  key: z.string().min(1).max(64),
  capability: capabilitySchema,
  instruction: z.string().min(1).max(2000),
  required: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const evidenceRequirementSchema = z.object({
  kind: evidenceKindSchema,
  stepKey: z.string().max(64).optional(),
  required: z.boolean(),
  minCount: z.number().int().positive().optional(),
  maxCount: z.number().int().positive().optional(),
});

export const constraintSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(CONSTRAINT_KINDS as unknown as [string, ...string[]]),
  op: z.string().min(1),
  params: z.record(z.string(), z.unknown()),
  enforcement: z.enum(["hard", "soft"]),
  label: z.string().optional(),
});

export const rewardStrategySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("fixed"),
    amountMinor: z.number().int().nonnegative(),
    currency: z.string().min(3).max(8),
  }),
  z.object({
    kind: z.literal("per_unit"),
    amountMinor: z.number().int().nonnegative(),
    currency: z.string().min(3).max(8),
  }),
  z.object({
    kind: z.literal("tiered"),
    currency: z.string().min(3).max(8),
    tiers: z
      .array(
        z.object({
          minUnits: z.number().int().nonnegative(),
          maxUnits: z.number().int().positive().optional(),
          amountMinor: z.number().int().nonnegative(),
        }),
      )
      .min(1),
  }),
  z.object({
    kind: z.literal("milestone"),
    currency: z.string().min(3).max(8),
    milestones: z
      .array(
        z.object({
          key: z.string(),
          label: z.string(),
          thresholdUnits: z.number().int().positive(),
          amountMinor: z.number().int().nonnegative(),
        }),
      )
      .min(1),
  }),
  z.object({
    kind: z.literal("dynamic_future"),
    currency: z.string().min(3).max(8),
    engineKey: z.string().optional(),
  }),
]);

export const reviewRulesSchema = z.object({
  required: z.boolean(),
  actions: z.array(z.enum(REVIEW_ACTIONS as unknown as [string, ...string[]])).min(1),
  samplingRate: z.number().min(0).max(1).optional(),
  multiReviewCount: z.number().int().positive().optional(),
  escalateAfterHours: z.number().positive().optional(),
});

export const validationRulesSchema = z.object({
  mode: z.enum(VALIDATION_MODES as unknown as [string, ...string[]]),
  ruleKeys: z.array(z.string()).default([]),
  aiAssist: z.boolean().optional(),
  autoApproveIf: z.array(z.string()).optional(),
  rejectIf: z.array(z.string()).optional(),
});

export const createTaskTemplateSchema = z.object({
  templateKey: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_]+$/),
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(4).max(4000),
  category: z.string().min(2).max(80),
  subcategory: z.string().max(80).nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  estimatedDurationMin: z.number().int().positive().nullable().optional(),
  capabilitySet: z.array(templateStepSchema).min(1),
  requiredEvidence: z.array(evidenceRequirementSchema),
  submissionSchema: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()),
    required: z.array(z.string()).optional(),
  }),
  validationRules: validationRulesSchema,
  reviewRules: reviewRulesSchema,
  rewardStrategy: rewardStrategySchema,
  constraints: z.array(constraintSchema).default([]),
  supportedPlatforms: z.array(z.string()).default([]),
  supportedDevices: z.array(z.string()).default([]),
  supportedCountries: z.array(z.string()).default([]),
  supportedLanguages: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  visibility: z.enum(["private", "organization", "platform", "public"]),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>;
