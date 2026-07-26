/**
 * Zod schemas for Review Engine.
 */

import { z } from "zod";
import {
  REVIEW_DECISION_OUTCOMES,
  REVIEW_FINDING_CATEGORIES,
  REVIEW_FINDING_SEVERITIES,
  REVIEW_MODES,
  REVIEW_POLICY_KEYS,
  REVIEW_QUEUE_STATUSES,
} from "@/constants/work-states";

export const reviewFindingSchema = z.object({
  category: z.enum(REVIEW_FINDING_CATEGORIES),
  severity: z.enum(REVIEW_FINDING_SEVERITIES),
  assignmentStepKey: z.string().min(1).optional().nullable(),
  evidenceItemId: z.string().min(1).optional().nullable(),
  validatorResultId: z.string().min(1).optional().nullable(),
  message: z.string().min(1).max(2000),
  recommendation: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const enqueueReviewSchema = z.object({
  submissionPublicId: z.string().min(1),
  validationReportPublicId: z.string().min(1).optional(),
  policyKey: z.enum(REVIEW_POLICY_KEYS).optional(),
});

export const claimQueueItemSchema = z.object({
  queueItemId: z.string().min(1),
});

export const startReviewSchema = z.object({
  queueItemId: z.string().min(1),
});

export const recordDecisionSchema = z.object({
  queueItemId: z.string().min(1),
  outcome: z.enum(REVIEW_DECISION_OUTCOMES),
  confidence: z.number().min(0).max(1).optional().nullable(),
  durationMs: z.number().int().nonnegative().optional().nullable(),
  comments: z.string().max(5000).optional().nullable(),
  requestedRevisions: z
    .union([z.array(z.string()), z.record(z.string(), z.unknown())])
    .optional()
    .nullable(),
  findings: z.array(reviewFindingSchema).default([]),
  reviewMode: z.enum(REVIEW_MODES).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const getReviewDecisionSchema = z.object({
  decisionPublicId: z.string().min(1),
});

export const listQueueSchema = z.object({
  status: z.enum(REVIEW_QUEUE_STATUSES).optional(),
  reviewerUserId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const getWorkspaceSchema = z.object({
  queueItemId: z.string().min(1),
});
