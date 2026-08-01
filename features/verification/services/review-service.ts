/**
 * Review Engine service — queue, decisions, submission integration.
 */

import "server-only";

import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  REVIEW_POLICY_KEYS,
  type ReviewPolicyKey,
  type SubmissionStatus,
} from "@/constants/work-states";
import { getReviewPolicy } from "@/constants/review-policies";
import {
  assertAssignmentTransition,
  canTransitionAssignment,
} from "@/features/assignments/services/lifecycle";
import { assignmentRepository } from "@/features/assignments/repositories";
import { assertSubmissionTransition } from "@/features/submissions/services/lifecycle";
import { submissionRepository } from "@/features/submissions/repositories";
import { validationRepository } from "@/features/verification/repositories";
import { reviewRepository } from "@/features/verification/repositories/review-repository";
import { evaluateReviewPolicy } from "@/features/verification/services/review-policy-engine";
import {
  assertReviewQueueTransition,
  lifecycleForQueueStatus,
  mapOutcomeToAssignmentStatus,
  mapOutcomeToSubmissionStatus,
} from "@/features/verification/services/review-lifecycle";
import {
  claimQueueItemSchema,
  enqueueReviewSchema,
  getReviewDecisionSchema,
  listQueueSchema,
  recordDecisionSchema,
  startReviewSchema,
} from "@/features/verification/validators/review";
import type {
  EnqueueReviewResult,
  ReviewDecisionPackage,
  ReviewQueueItemRecord,
} from "@/features/verification/types/review";

async function triggerSettlementForDecision(params: {
  decisionPublicId: string;
  outcome: string;
}): Promise<void> {
  const { createSettlementFromReview, cancelSettlementForRejectedReview } =
    await import("@/features/settlements/services/settlement-service");

  if (
    params.outcome === "approved" ||
    params.outcome === "approved_with_warning"
  ) {
    await createSettlementFromReview({
      input: { reviewDecisionPublicId: params.decisionPublicId },
    });
    return;
  }
  if (
    params.outcome === "rejected" ||
    params.outcome === "revision_requested"
  ) {
    await cancelSettlementForRejectedReview({
      reviewDecisionPublicId: params.decisionPublicId,
    });
  }
}

function resolvePolicyKey(
  explicit: ReviewPolicyKey | undefined,
  metadata: Record<string, unknown> | null,
): ReviewPolicyKey {
  if (explicit) return explicit;
  const fromMeta = metadata?.reviewPolicyKey;
  if (
    typeof fromMeta === "string" &&
    (REVIEW_POLICY_KEYS as readonly string[]).includes(fromMeta)
  ) {
    return fromMeta as ReviewPolicyKey;
  }
  return "auto_approve_high_score";
}

async function applySubmissionOutcome(params: {
  submissionId: string;
  assignmentId: string;
  outcome: string;
  fromStatus: SubmissionStatus;
}): Promise<void> {
  const submissionStatus = mapOutcomeToSubmissionStatus(params.outcome);
  if (params.fromStatus !== submissionStatus) {
    assertSubmissionTransition(params.fromStatus, submissionStatus);
    await submissionRepository.setStatus({
      id: params.submissionId,
      status: submissionStatus,
    });
  }

  const assignment = await assignmentRepository.findById(params.assignmentId);
  if (!assignment) return;

  let assignmentStatus = assignment.status;
  if (
    assignmentStatus === "under_validation" &&
    canTransitionAssignment(assignmentStatus, "under_review")
  ) {
    await assignmentRepository.updateStatus({
      id: assignment.id,
      status: "under_review",
    });
    assignmentStatus = "under_review";
  }

  const target = mapOutcomeToAssignmentStatus(params.outcome);
  if (assignmentStatus !== target && canTransitionAssignment(assignmentStatus, target)) {
    assertAssignmentTransition(assignmentStatus, target);
    await assignmentRepository.updateStatus({
      id: assignment.id,
      status: target,
      ...(target === "approved" || target === "rejected"
        ? { completedAt: new Date() }
        : {}),
    });
  }
}

export async function enqueueForReview(params: {
  input: unknown;
  sampleRoll?: number;
}): Promise<ApiResponse<EnqueueReviewResult>> {
  try {
    const parsed = enqueueReviewSchema.parse(params.input);
    const submission = await submissionRepository.findByPublicId(
      parsed.submissionPublicId,
    );
    if (!submission) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }
    if (
      submission.status !== "validation_complete" &&
      submission.status !== "in_review"
    ) {
      throw new AppError(
        "INVALID_STATUS",
        `Submission must be validation_complete or in_review (got ${submission.status})`,
        400,
      );
    }

    const existing = await reviewRepository.findOpenQueueItemForSubmission(
      submission.id,
    );
    if (existing && submission.status === "in_review") {
      return apiSuccess({
        queueItem: existing,
        autoDecision: null,
        policyEvaluation: {
          action: "enqueue_human",
          reason: "Open queue item already exists",
        },
      });
    }

    const reports = await validationRepository.listReportsForSubmission(
      submission.id,
    );
    const reportSummary = parsed.validationReportPublicId
      ? reports.find((r) => r.publicId === parsed.validationReportPublicId)
      : reports[0];
    if (!reportSummary) {
      throw new AppError("NO_VALIDATION_REPORT", "No validation report found", 400);
    }
    const reportPkg = await validationRepository.getReportPackage(
      reportSummary.id,
    );
    if (!reportPkg) {
      throw new AppError("REPORT_INCOMPLETE", "Validation report incomplete", 500);
    }

    const policyKey = resolvePolicyKey(parsed.policyKey, submission.metadata);
    const policy = getReviewPolicy(policyKey);
    const policyId = await reviewRepository.findPolicyIdByKey(policyKey);

    const reward =
      submission.executionContextSnapshot.rewardSnapshot?.rewardPerUnitMinor ??
      null;

    const evaluation = evaluateReviewPolicy({
      policy,
      report: reportPkg.report,
      rewardPerUnitMinor: reward,
      sampleRoll: params.sampleRoll,
    });

    let initialStatus: ReviewQueueItemRecord["status"] = "pending";
    if (evaluation.action === "enqueue_escalated") {
      initialStatus = "escalated";
    } else if (evaluation.action === "defer") {
      initialStatus = "deferred";
    } else if (evaluation.action === "auto_approve") {
      initialStatus = "pending";
    }

    const queueItem = await reviewRepository.createQueueItem({
      submissionId: submission.id,
      validationReportId: reportPkg.report.id,
      policyKey,
      policyId,
      policySnapshot: policy,
      status: initialStatus,
      lifecycleStatus: lifecycleForQueueStatus(initialStatus),
      priority: evaluation.action === "enqueue_escalated" ? 100 : 0,
      metadata: { policyEvaluation: evaluation },
    });

    // Move submission into review when human path
    if (
      evaluation.action === "enqueue_human" ||
      evaluation.action === "enqueue_escalated" ||
      evaluation.action === "defer"
    ) {
      if (submission.status === "validation_complete") {
        assertSubmissionTransition(submission.status, "in_review");
        await submissionRepository.setStatus({
          id: submission.id,
          status: "in_review",
        });
      }
      const assignment = await assignmentRepository.findById(
        submission.assignmentId,
      );
      if (
        assignment &&
        assignment.status === "under_validation" &&
        canTransitionAssignment(assignment.status, "under_review")
      ) {
        await assignmentRepository.updateStatus({
          id: assignment.id,
          status: "under_review",
        });
      }
      if (evaluation.action === "defer" && evaluation.outcome === "deferred") {
        // Queue deferred; decision recorded as deferred for audit
        const publicId = await generatePublicId("review_decision");
        const autoDecision = await reviewRepository.createDecision({
          publicId,
          submissionId: submission.id,
          validationReportId: reportPkg.report.id,
          queueItemId: queueItem.id,
          reviewerUserId: null,
          reviewMode: policy.mode,
          outcome: "deferred",
          confidence: 1,
          durationMs: 0,
          comments: evaluation.reason,
          requestedRevisions: null,
          policySnapshot: policy,
          metadata: { automatic: true, policyEvaluation: evaluation },
          findings: [],
        });
        await reviewRepository.updateQueueItem({
          id: queueItem.id,
          status: "deferred",
          lifecycleStatus: "pending",
        });
        return apiSuccess({
          queueItem: (await reviewRepository.findQueueItemById(queueItem.id))!,
          autoDecision,
          policyEvaluation: evaluation,
        });
      }

      return apiSuccess({
        queueItem,
        autoDecision: null,
        policyEvaluation: evaluation,
      });
    }

    // Auto-approve path
    const publicId = await generatePublicId("review_decision");
    const autoDecision = await reviewRepository.createDecision({
      publicId,
      submissionId: submission.id,
      validationReportId: reportPkg.report.id,
      queueItemId: queueItem.id,
      reviewerUserId: null,
      reviewMode: "automatic",
      outcome: evaluation.outcome ?? "approved",
      confidence: 1,
      durationMs: 0,
      comments: evaluation.reason,
      requestedRevisions: null,
      policySnapshot: policy,
      metadata: { automatic: true, policyEvaluation: evaluation },
      findings: [],
    });

    await reviewRepository.updateQueueItem({
      id: queueItem.id,
      status: "completed",
      lifecycleStatus: "decision_recorded",
      completedAt: new Date(),
    });

    await applySubmissionOutcome({
      submissionId: submission.id,
      assignmentId: submission.assignmentId,
      outcome: evaluation.outcome ?? "approved",
      fromStatus: submission.status,
    });

    await triggerSettlementForDecision({
      decisionPublicId: autoDecision.decision.publicId,
      outcome: evaluation.outcome ?? "approved",
    });

    const closed = await reviewRepository.updateQueueItem({
      id: queueItem.id,
      lifecycleStatus: "closed",
    });

    return apiSuccess({
      queueItem: closed,
      autoDecision,
      policyEvaluation: evaluation,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "ENQUEUE_FAILED",
      error instanceof Error ? error.message : "Could not enqueue review",
    );
  }
}

export async function claimQueueItem(params: {
  input: unknown;
  reviewerUserId: string;
}): Promise<ApiResponse<ReviewQueueItemRecord>> {
  try {
    const parsed = claimQueueItemSchema.parse(params.input);
    const item = await reviewRepository.findQueueItemById(parsed.queueItemId);
    if (!item) {
      throw new AppError("NOT_FOUND", "Queue item not found", 404);
    }
    assertReviewQueueTransition(item.status, "assigned");
    await reviewRepository.createReviewAssignment({
      queueItemId: item.id,
      reviewerUserId: params.reviewerUserId,
      role: "primary",
    });
    const updated = await reviewRepository.updateQueueItem({
      id: item.id,
      status: "assigned",
      lifecycleStatus: "assigned",
      assignedReviewerId: params.reviewerUserId,
      claimedAt: new Date(),
    });
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CLAIM_FAILED",
      error instanceof Error ? error.message : "Could not claim queue item",
    );
  }
}

export async function startReview(params: {
  input: unknown;
  reviewerUserId: string;
}): Promise<ApiResponse<ReviewQueueItemRecord>> {
  try {
    const parsed = startReviewSchema.parse(params.input);
    const item = await reviewRepository.findQueueItemById(parsed.queueItemId);
    if (!item) {
      throw new AppError("NOT_FOUND", "Queue item not found", 404);
    }
    if (
      item.assignedReviewerId &&
      item.assignedReviewerId !== params.reviewerUserId
    ) {
      throw new AppError("FORBIDDEN", "Queue item assigned to another reviewer", 403);
    }
    const from = item.status === "pending" ? "pending" : item.status;
    if (from === "pending") {
      assertReviewQueueTransition("pending", "in_review");
    } else {
      assertReviewQueueTransition(from, "in_review");
    }
    if (!item.assignedReviewerId) {
      await reviewRepository.createReviewAssignment({
        queueItemId: item.id,
        reviewerUserId: params.reviewerUserId,
      });
    }
    const updated = await reviewRepository.updateQueueItem({
      id: item.id,
      status: "in_review",
      lifecycleStatus: "in_review",
      assignedReviewerId: params.reviewerUserId,
      claimedAt: item.claimedAt ? new Date(item.claimedAt) : new Date(),
      startedAt: new Date(),
    });
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "START_FAILED",
      error instanceof Error ? error.message : "Could not start review",
    );
  }
}

export async function recordReviewDecision(params: {
  input: unknown;
  reviewerUserId: string;
}): Promise<ApiResponse<ReviewDecisionPackage>> {
  try {
    const parsed = recordDecisionSchema.parse(params.input);
    const item = await reviewRepository.findQueueItemById(parsed.queueItemId);
    if (!item) {
      throw new AppError("NOT_FOUND", "Queue item not found", 404);
    }
    if (item.status === "completed") {
      throw new AppError("ALREADY_DECIDED", "Queue item already completed", 400);
    }
    if (
      item.assignedReviewerId &&
      item.assignedReviewerId !== params.reviewerUserId
    ) {
      throw new AppError("FORBIDDEN", "Queue item assigned to another reviewer", 403);
    }

    if (item.status !== "in_review") {
      assertReviewQueueTransition(item.status, "in_review");
      await reviewRepository.updateQueueItem({
        id: item.id,
        status: "in_review",
        lifecycleStatus: "in_review",
        assignedReviewerId: params.reviewerUserId,
        startedAt: new Date(),
      });
    }

    const submission = await submissionRepository.findById(item.submissionId);
    if (!submission) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }

    const publicId = await generatePublicId("review_decision");
    const decisionPkg = await reviewRepository.createDecision({
      publicId,
      submissionId: item.submissionId,
      validationReportId: item.validationReportId,
      queueItemId: item.id,
      reviewerUserId: params.reviewerUserId,
      reviewMode: parsed.reviewMode ?? "human",
      outcome: parsed.outcome,
      confidence: parsed.confidence ?? null,
      durationMs: parsed.durationMs ?? null,
      comments: parsed.comments ?? null,
      requestedRevisions: parsed.requestedRevisions ?? null,
      policySnapshot: item.policySnapshot,
      metadata: parsed.metadata ?? null,
      findings: parsed.findings,
    });

    const queueStatus =
      parsed.outcome === "escalated"
        ? "escalated"
        : parsed.outcome === "deferred"
          ? "deferred"
          : "completed";

    assertReviewQueueTransition("in_review", queueStatus);
    await reviewRepository.updateQueueItem({
      id: item.id,
      status: queueStatus,
      lifecycleStatus:
        queueStatus === "completed" ? "decision_recorded" : lifecycleForQueueStatus(queueStatus),
      completedAt: queueStatus === "completed" ? new Date() : null,
    });

    await applySubmissionOutcome({
      submissionId: submission.id,
      assignmentId: submission.assignmentId,
      outcome: parsed.outcome,
      fromStatus: submission.status === "validation_complete" ? "validation_complete" : "in_review",
    });

    if (queueStatus === "completed") {
      await reviewRepository.updateQueueItem({
        id: item.id,
        lifecycleStatus: "closed",
      });
    }

    await triggerSettlementForDecision({
      decisionPublicId: decisionPkg.decision.publicId,
      outcome: parsed.outcome,
    });

    const trustType =
      parsed.outcome === "approved" ||
      parsed.outcome === "approved_with_warning"
        ? "submission_approved"
        : parsed.outcome === "rejected"
          ? "submission_rejected"
          : parsed.outcome === "revision_requested"
            ? "submission_revision_requested"
            : null;
    const { safeRecordTrustEvent } = await import("@/lib/trust/safe-emit");
    if (trustType) {
      await safeRecordTrustEvent({
        subjectType: "worker",
        subjectId: submission.workerUserId,
        eventType: trustType,
        idempotencyKey: `trust:${trustType}:${decisionPkg.decision.publicId}`,
        payload: {
          decisionPublicId: decisionPkg.decision.publicId,
          outcome: parsed.outcome,
        },
        span: "review.decision.trust",
      });
    }
    await safeRecordTrustEvent({
      subjectType: "worker",
      subjectId: submission.workerUserId,
      eventType: "review_completed",
      idempotencyKey: `trust:review_completed:${decisionPkg.decision.publicId}`,
      payload: { outcome: parsed.outcome },
      span: "review.decision.trust",
    });

    const { safeRecordAnalyticsEvent } = await import(
      "@/lib/analytics/safe-emit"
    );
    await safeRecordAnalyticsEvent({
      source: "reviews",
      eventType: "review.completed",
      idempotencyKey: `analytics:review.completed:${decisionPkg.decision.publicId}`,
      entityType: "review_decision",
      entityId: decisionPkg.decision.publicId,
      userId: submission.workerUserId,
      payload: { outcome: parsed.outcome },
      span: "review.decision.analytics",
    });

    const { safeRecordAutomationEvent } = await import(
      "@/lib/automation/safe-emit"
    );
    const automationTrigger =
      parsed.outcome === "approved" ||
      parsed.outcome === "approved_with_warning"
        ? "submission.approved"
        : parsed.outcome === "rejected"
          ? "submission.rejected"
          : null;
    if (automationTrigger) {
      await safeRecordAutomationEvent({
        trigger: automationTrigger,
        idempotencyKey: `automation:${automationTrigger}:${decisionPkg.decision.publicId}`,
        userId: submission.workerUserId,
        payload: {
          submissionId: submission.publicId,
          decisionPublicId: decisionPkg.decision.publicId,
          outcome: parsed.outcome,
          userId: submission.workerUserId,
        },
        span: "review.decision.automation",
      });
    }

    return apiSuccess(decisionPkg);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "DECISION_FAILED",
      error instanceof Error ? error.message : "Could not record decision",
    );
  }
}

export async function getReviewDecision(params: {
  input: unknown;
}): Promise<ApiResponse<ReviewDecisionPackage>> {
  try {
    const parsed = getReviewDecisionSchema.parse(params.input);
    const pkg = await reviewRepository.findDecisionByPublicId(
      parsed.decisionPublicId,
    );
    if (!pkg) {
      throw new AppError("NOT_FOUND", "Review decision not found", 404);
    }
    return apiSuccess(pkg);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "GET_FAILED",
      error instanceof Error ? error.message : "Could not load decision",
    );
  }
}

export async function listReviewQueue(params: {
  input: unknown;
}): Promise<ApiResponse<ReviewQueueItemRecord[]>> {
  try {
    const parsed = listQueueSchema.parse(params.input);
    const items = await reviewRepository.listQueue({
      status: parsed.status,
      reviewerUserId: parsed.reviewerUserId,
      limit: parsed.limit,
    });
    return apiSuccess(items);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "LIST_FAILED",
      error instanceof Error ? error.message : "Could not list queue",
    );
  }
}
