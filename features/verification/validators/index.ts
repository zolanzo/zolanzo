/**
 * Zod schemas for Validation + Review engines.
 */

import { z } from "zod";
import { VALIDATION_PROFILE_KEYS } from "@/constants/work-states";

export const runValidationSchema = z.object({
  submissionPublicId: z.string().min(1),
  profileKey: z.enum(VALIDATION_PROFILE_KEYS).optional(),
});

export const getValidationReportSchema = z.object({
  reportPublicId: z.string().min(1),
});

export const listValidationReportsSchema = z.object({
  submissionPublicId: z.string().min(1),
});

export type RunValidationInput = z.infer<typeof runValidationSchema>;

export {
  reviewFindingSchema,
  enqueueReviewSchema,
  claimQueueItemSchema,
  startReviewSchema,
  recordDecisionSchema,
  getReviewDecisionSchema,
  listQueueSchema,
  getWorkspaceSchema,
} from "@/features/verification/validators/review";
