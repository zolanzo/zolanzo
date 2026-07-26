"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type {
  EnqueueReviewResult,
  ReviewDecisionPackage,
  ReviewerWorkspace,
  ReviewQueueItemRecord,
} from "@/features/verification/types/review";
import {
  claimQueueItem,
  enqueueForReview,
  getReviewDecision,
  listReviewQueue,
  recordReviewDecision,
  startReview,
} from "@/features/verification/services/review-service";
import { getReviewerWorkspace } from "@/features/verification/services/review-workspace";

export async function enqueueForReviewAction(
  input: unknown,
): Promise<ApiResponse<EnqueueReviewResult>> {
  await requireAuthContext();
  return enqueueForReview({ input });
}

export async function claimQueueItemAction(
  queueItemId: string,
): Promise<ApiResponse<ReviewQueueItemRecord>> {
  const ctx = await requireAuthContext();
  return claimQueueItem({
    input: { queueItemId },
    reviewerUserId: ctx.user.id,
  });
}

export async function startReviewAction(
  queueItemId: string,
): Promise<ApiResponse<ReviewQueueItemRecord>> {
  const ctx = await requireAuthContext();
  return startReview({
    input: { queueItemId },
    reviewerUserId: ctx.user.id,
  });
}

export async function recordReviewDecisionAction(
  input: unknown,
): Promise<ApiResponse<ReviewDecisionPackage>> {
  const ctx = await requireAuthContext();
  return recordReviewDecision({
    input,
    reviewerUserId: ctx.user.id,
  });
}

export async function getReviewDecisionAction(
  decisionPublicId: string,
): Promise<ApiResponse<ReviewDecisionPackage>> {
  await requireAuthContext();
  return getReviewDecision({ input: { decisionPublicId } });
}

export async function listReviewQueueAction(
  input: unknown = {},
): Promise<ApiResponse<ReviewQueueItemRecord[]>> {
  await requireAuthContext();
  return listReviewQueue({ input });
}

export async function getReviewerWorkspaceAction(
  queueItemId: string,
): Promise<ApiResponse<ReviewerWorkspace>> {
  await requireAuthContext();
  return getReviewerWorkspace({ input: { queueItemId } });
}
