import { z } from "zod";
import { CONSTRAINT_KINDS } from "@/constants/constraints";
import { GENERATION_STRATEGIES } from "@/constants/generation-strategies";
import { GENERATION_POLICIES } from "@/constants/generation-policies";
import { SCHEDULE_MODES } from "@/constants/campaign-schedule";
import { CAMPAIGN_STATUSES } from "@/constants/work-states";
import { rewardStrategySchema } from "@/features/task-templates/validators";

export const campaignBriefSchema = z.object({
  businessObjective: z.string().min(1).max(4000),
  successMetrics: z.array(z.string().min(1).max(500)).min(1),
  workerInstructions: z.string().min(1).max(8000),
  qualityExpectations: z.string().min(1).max(4000),
  acceptableExamples: z.array(z.string().min(1).max(2000)).default([]),
  unacceptableExamples: z.array(z.string().min(1).max(2000)).default([]),
  reviewerGuidance: z.string().min(1).max(4000),
});

export const campaignConstraintSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(CONSTRAINT_KINDS as unknown as [string, ...string[]]),
  op: z.string().min(1),
  params: z.record(z.string(), z.unknown()),
  enforcement: z.enum(["hard", "soft"]),
  label: z.string().optional(),
});

export const generationConfigSchema = z
  .object({
    batchSize: z.number().int().positive().optional(),
    intervalMinutes: z.number().int().positive().optional(),
    sourceKey: z.string().max(128).optional(),
    allowExternalCreate: z.boolean().optional(),
  })
  .nullable()
  .optional();

export const generationPolicyConfigSchema = z
  .discriminatedUnion("policy", [
    z.object({
      policy: z.literal("fixed_quantity"),
      quantity: z.number().int().positive(),
    }),
    z.object({
      policy: z.literal("rolling_window"),
      windowSize: z.number().int().positive(),
    }),
    z.object({
      policy: z.literal("demand_buffer"),
      maintainAvailable: z.number().int().positive(),
      refillBelow: z.number().int().nonnegative(),
    }),
    z.object({
      policy: z.literal("scheduled_batch"),
      batchSize: z.number().int().positive(),
      intervalMinutes: z.number().int().positive().optional(),
      cronExpression: z.string().max(128).optional(),
    }),
    z.object({
      policy: z.literal("api_controlled"),
      maxPerRequest: z.number().int().positive().optional(),
    }),
  ])
  .nullable()
  .optional();

export const claimPolicyRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("one_active_per_campaign") }),
  z.object({
    kind: z.literal("max_concurrent_assignments"),
    max: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("cooldown_after_completion"),
    cooldownMinutes: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("invite_only"),
    inviteTokenRequired: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("organization_only"),
    organizationIds: z.array(z.string().min(1)).optional(),
  }),
  z.object({ kind: z.literal("first_come_first_served") }),
  z.object({
    kind: z.literal("lottery_future"),
    weightKey: z.string().optional(),
  }),
  z.object({
    kind: z.literal("priority_trust_future"),
    minTrustScore: z.number().min(0).max(100).optional(),
  }),
]);

export const createCampaignSchema = z
  .object({
    organizationId: z.string().min(1),
    clientUserId: z.string().min(1),
    taskTemplateId: z.string().min(1),
    name: z.string().min(1).max(200),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
    description: z.string().min(1).max(4000),
    objective: z.string().min(1).max(2000),
    visibility: z
      .enum(["private", "organization", "platform", "public"])
      .default("organization"),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    category: z.string().min(1).max(80),
    tags: z.array(z.string().min(1).max(64)).default([]),
    brief: campaignBriefSchema,
    generationStrategy: z.enum(
      GENERATION_STRATEGIES as unknown as [string, ...string[]],
    ),
    generationConfig: generationConfigSchema,
    generationPolicy: z
      .enum(GENERATION_POLICIES as unknown as [string, ...string[]])
      .default("fixed_quantity"),
    generationPolicyConfig: generationPolicyConfigSchema,
    targetQuantity: z.number().int().positive(),
    budgetKind: z.enum(["fixed", "quantity_times_reward"]),
    currency: z.string().min(3).max(8).default("NGN"),
    budgetMinor: z.number().int().positive().optional(),
    rewardPerUnitMinor: z.number().int().nonnegative(),
    rewardStrategyOverride: rewardStrategySchema.nullable().optional(),
    countryScope: z.array(z.string().min(2).max(8)).default([]),
    languageScope: z.array(z.string().min(2).max(16)).default([]),
    deviceScope: z.array(z.string().min(1).max(64)).default([]),
    audienceConstraints: z.array(campaignConstraintSchema).default([]),
    claimPolicies: z.array(claimPolicyRuleSchema).default([
      { kind: "first_come_first_served" },
      { kind: "one_active_per_campaign" },
      { kind: "max_concurrent_assignments", max: 10 },
    ]),
    reservationTimeoutSeconds: z.number().int().positive().default(120),
    scheduleMode: z
      .enum(SCHEDULE_MODES as unknown as [string, ...string[]])
      .default("immediate"),
    timezone: z.string().min(1).max(64).default("UTC"),
    startAt: z.string().datetime().nullable().optional(),
    endAt: z.string().datetime().nullable().optional(),
    recurrenceRule: z.string().max(512).nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.budgetKind === "fixed" && (data.budgetMinor ?? 0) <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["budgetMinor"],
        message: "budgetMinor is required for fixed budgets",
      });
    }
    if (data.generationStrategy === "batch") {
      if (!data.generationConfig?.batchSize) {
        ctx.addIssue({
          code: "custom",
          path: ["generationConfig", "batchSize"],
          message: "batch strategy requires batchSize",
        });
      }
      if (!data.generationConfig?.intervalMinutes) {
        ctx.addIssue({
          code: "custom",
          path: ["generationConfig", "intervalMinutes"],
          message: "batch strategy requires intervalMinutes",
        });
      }
    }
    if (data.scheduleMode === "scheduled" && !data.startAt) {
      ctx.addIssue({
        code: "custom",
        path: ["startAt"],
        message: "scheduled mode requires startAt",
      });
    }
    if (data.scheduleMode === "recurring_future" && !data.recurrenceRule) {
      ctx.addIssue({
        code: "custom",
        path: ["recurrenceRule"],
        message: "recurring_future requires recurrenceRule (future-ready)",
      });
    }
    if (
      data.generationPolicy === "demand_buffer" &&
      data.generationPolicyConfig?.policy === "demand_buffer" &&
      data.generationPolicyConfig.refillBelow >
        data.generationPolicyConfig.maintainAvailable
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["generationPolicyConfig", "refillBelow"],
        message: "refillBelow must be <= maintainAvailable",
      });
    }
  });

export const updateCampaignSchema = createCampaignSchema
  .omit({
    organizationId: true,
    clientUserId: true,
    taskTemplateId: true,
  })
  .partial()
  .extend({
    name: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    brief: campaignBriefSchema.optional(),
  });

export const campaignStatusSchema = z.enum(
  CAMPAIGN_STATUSES as unknown as [string, ...string[]],
);

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
