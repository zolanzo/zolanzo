import { z } from "zod";
import { GENERATION_STRATEGIES } from "@/constants/generation-strategies";
import { GENERATION_POLICIES } from "@/constants/generation-policies";
import { TASK_INSTANCE_STATUSES } from "@/constants/work-states";
import { generationPolicyConfigSchema } from "@/features/campaigns/validators";

export const generateTaskInstancesSchema = z.object({
  campaignId: z.string().min(1),
  /** Override quantity for api_controlled / explicit runs */
  quantityOverride: z.number().int().positive().optional(),
  /** Release to available immediately (default true) */
  releaseToAvailable: z.boolean().default(true),
  /** Optional TTL hours from now */
  expiresInHours: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const previewGenerationSchema = z.object({
  campaignId: z.string().min(1),
  quantityOverride: z.number().int().positive().optional(),
});

export const transitionTaskInstanceSchema = z.object({
  id: z.string().min(1),
  to: z.enum(TASK_INSTANCE_STATUSES as unknown as [string, ...string[]]),
});

export const generationPolicySnapshotSchema = z.object({
  policy: z.enum(GENERATION_POLICIES as unknown as [string, ...string[]]),
  config: generationPolicyConfigSchema,
});

export const strategySnapshotSchema = z.enum(
  GENERATION_STRATEGIES as unknown as [string, ...string[]],
);

export type GenerateTaskInstancesInput = z.infer<
  typeof generateTaskInstancesSchema
>;
export type PreviewGenerationInput = z.infer<typeof previewGenerationSchema>;
