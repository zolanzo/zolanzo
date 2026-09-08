"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requireAuthContext } from "@/lib/auth/session";
import { assertHirerReviewAccess } from "@/lib/auth/resource-guards";
import { apiError, apiSuccess, AppError, type ApiResponse } from "@/lib/api/response";
import {
  enqueueForReview,
  recordReviewDecision,
} from "@/features/verification/services/review-service";
import { reviewRepository } from "@/features/verification/repositories/review-repository";
import { submissionRepository } from "@/features/submissions/repositories";
import type { ReviewDecisionPackage } from "@/features/verification/types/review";
import type { CampaignBrief } from "@/features/campaigns/types";

const hirerDecisionSchema = z.object({
  submissionPublicId: z.string().min(1),
  outcome: z.enum(["approved", "rejected"]),
  comments: z.string().max(5000).optional(),
});

export type HirerReviewEvidence = {
  id: string;
  kind: string;
  label: string;
  preview: string | null;
};

export type HirerReviewDetail = {
  submissionPublicId: string;
  status: string;
  campaignName: string;
  campaignPublicId: string;
  workerName: string;
  instructions: string;
  canDecide: boolean;
  blockedReason: string | null;
  evidence: HirerReviewEvidence[];
};

async function loadOwnedSubmission(submissionPublicId: string) {
  const ctx = await requireAuthContext();
  const row = await prisma.submission.findFirst({
    where: { publicId: submissionPublicId },
    include: {
      assignment: {
        include: {
          campaign: {
            select: {
              id: true,
              publicId: true,
              name: true,
              organizationId: true,
              clientUserId: true,
              brief: true,
              description: true,
            },
          },
        },
      },
      worker: {
        select: {
          profile: { select: { displayName: true } },
        },
      },
    },
  });
  if (!row) {
    throw new AppError("NOT_FOUND", "Submission not found", 404);
  }
  assertHirerReviewAccess({
    user: ctx.user,
    organizationId: row.assignment.campaign.organizationId,
    clientUserId: row.assignment.campaign.clientUserId,
  });
  return { ctx, row };
}

function previewEvidence(
  inlinePayload: unknown,
): string | null {
  if (typeof inlinePayload === "string" && inlinePayload.trim()) {
    return inlinePayload.slice(0, 2000);
  }
  if (inlinePayload && typeof inlinePayload === "object" && !Array.isArray(inlinePayload)) {
    const rec = inlinePayload as Record<string, unknown>;
    const text =
      (typeof rec.text === "string" && rec.text) ||
      (typeof rec.url === "string" && rec.url) ||
      (typeof rec.value === "string" && rec.value) ||
      null;
    return text ? text.slice(0, 2000) : null;
  }
  return null;
}

export async function getHirerSubmissionReviewAction(
  submissionPublicId: string,
): Promise<ApiResponse<HirerReviewDetail>> {
  try {
    const { row } = await loadOwnedSubmission(submissionPublicId);
    const pkg = await submissionRepository.getPackage(row.id);
    const brief = row.assignment.campaign.brief as CampaignBrief | null;
    const status = row.status;
    const canDecide = ["validation_complete", "in_review"].includes(status);
    const blockedReason = canDecide
      ? null
      : status === "submitted" || status === "validating"
        ? "This submission is still in validation. A decision is available after the review queue is ready."
        : `This submission is ${status.replaceAll("_", " ")} and cannot be decided here.`;

    return apiSuccess({
      submissionPublicId: row.publicId,
      status,
      campaignName: row.assignment.campaign.name,
      campaignPublicId: row.assignment.campaign.publicId,
      workerName: row.worker.profile?.displayName ?? "Worker",
      instructions:
        brief?.workerInstructions ?? row.assignment.campaign.description,
      canDecide,
      blockedReason,
      evidence: (pkg?.items ?? []).map((item) => ({
        id: item.id,
        kind: item.kind,
        label: item.label,
        preview: previewEvidence(item.inlinePayload),
      })),
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "REVIEW_LOAD_FAILED",
      error instanceof Error ? error.message : "Could not load submission",
    );
  }
}

export async function recordHirerSubmissionDecisionAction(
  input: unknown,
): Promise<ApiResponse<ReviewDecisionPackage>> {
  try {
    const parsed = hirerDecisionSchema.parse(input);
    const { ctx, row } = await loadOwnedSubmission(parsed.submissionPublicId);

    if (!["validation_complete", "in_review"].includes(row.status)) {
      throw new AppError(
        "INVALID_STATUS",
        "This submission is not ready for a hirer decision",
        409,
      );
    }

    let queueItem = await reviewRepository.findOpenQueueItemForSubmission(row.id);
    if (!queueItem) {
      const enqueued = await enqueueForReview({
        input: { submissionPublicId: row.publicId },
      });
      if (!enqueued.ok) return enqueued;
      if (enqueued.data.autoDecision) {
        return apiSuccess(enqueued.data.autoDecision);
      }
      queueItem = enqueued.data.queueItem;
    }

    return recordReviewDecision({
      input: {
        queueItemId: queueItem.id,
        outcome: parsed.outcome,
        comments: parsed.comments?.trim() || null,
        findings: [],
        reviewMode: "human",
      },
      reviewerUserId: ctx.user.id,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "REVIEW_DECISION_FAILED",
      error instanceof Error ? error.message : "Could not record decision",
    );
  }
}
