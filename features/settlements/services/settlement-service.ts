/**
 * Settlement Engine — Review Decision → Settlement → Ledger → Wallet projection.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  SETTLEMENT_POLICY_KEYS,
  SETTLEMENT_TRANSITIONS,
  type SettlementPolicyKey,
  type SettlementStatus,
} from "@/constants/finance-enums";
import {
  getSettlementPolicy,
  type SettlementPolicyDefinition,
} from "@/constants/settlement-policies";
import { reviewRepository } from "@/features/verification/repositories/review-repository";
import { submissionRepository } from "@/features/submissions/repositories";
import { assignmentRepository } from "@/features/assignments/repositories";
import {
  ensureEscrowSnapshotForCampaign,
  releaseEscrowAccount,
  reserveEscrowForAssignment,
  cancelEscrowAccount,
} from "@/features/escrow/services/escrow-service";
import {
  ensureWorkerWallet,
  projectWallet,
} from "@/features/wallet/services/projection";
import { safeEmitDomainNotification } from "@/features/notifications/services/safe-emit";
import { z } from "zod";

export type SettlementRecord = {
  id: string;
  publicId: string;
  status: SettlementStatus;
  policyKey: SettlementPolicyKey;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  batchId: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  ledgerTransactionId: string | null;
  reviewDecisionId: string;
  idempotencyKey: string;
};

function canTransitionSettlement(
  from: SettlementStatus,
  to: SettlementStatus,
): boolean {
  return SETTLEMENT_TRANSITIONS[from].includes(to);
}

function mapSettlement(row: {
  id: string;
  publicId: string;
  status: string;
  policyKey: string;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  batchId: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  ledgerTransactionId: string | null;
  reviewDecisionId: string;
  idempotencyKey: string;
}): SettlementRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    status: row.status as SettlementStatus,
    policyKey: row.policyKey as SettlementPolicyKey,
    amountMinor: row.amountMinor,
    feeMinor: row.feeMinor,
    netMinor: row.netMinor,
    currency: row.currency,
    batchId: row.batchId,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    ledgerTransactionId: row.ledgerTransactionId,
    reviewDecisionId: row.reviewDecisionId,
    idempotencyKey: row.idempotencyKey,
  };
}

function resolvePolicyKey(
  metadata: Record<string, unknown> | null,
  snapshotKey: SettlementPolicyKey,
): SettlementPolicyKey {
  const key = metadata?.settlementPolicyKey;
  if (
    typeof key === "string" &&
    (SETTLEMENT_POLICY_KEYS as readonly string[]).includes(key)
  ) {
    return key as SettlementPolicyKey;
  }
  return snapshotKey;
}

function periodKeyFor(mode: "daily" | "weekly", now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  if (mode === "daily") return `${y}-${m}-${d}`;
  // ISO week-ish: year-W + day-of-year / 7
  const start = Date.UTC(y, 0, 1);
  const week = Math.floor((now.getTime() - start) / (7 * 24 * 3600 * 1000)) + 1;
  return `${y}-W${String(week).padStart(2, "0")}`;
}

async function findOrCreateBatch(params: {
  batchMode: "daily" | "weekly";
  currency: string;
}): Promise<{ id: string; publicId: string }> {
  const periodKey = periodKeyFor(params.batchMode);
  const existing = await prisma.settlementBatch.findUnique({
    where: {
      batchMode_periodKey_currency: {
        batchMode: params.batchMode,
        periodKey,
        currency: params.currency,
      },
    },
    select: { id: true, publicId: true },
  });
  if (existing) return existing;
  const publicId = await generatePublicId("settlement_batch");
  return prisma.settlementBatch.create({
    data: {
      publicId,
      status: "created",
      currency: params.currency,
      batchMode: params.batchMode,
      periodKey,
    },
    select: { id: true, publicId: true },
  });
}

async function processSettlementRelease(
  settlementId: string,
): Promise<SettlementRecord> {
  const row = await prisma.settlement.findUnique({ where: { id: settlementId } });
  if (!row) throw new AppError("NOT_FOUND", "Settlement not found", 404);
  if (row.status === "completed") return mapSettlement(row);

  if (!canTransitionSettlement(row.status as SettlementStatus, "processing")) {
    throw new AppError(
      "INVALID_STATUS",
      `Cannot process settlement in status ${row.status}`,
      400,
    );
  }

  await prisma.settlement.update({
    where: { id: row.id },
    data: { status: "processing", processingAt: new Date() },
  });

  try {
    let accountId = row.escrowAccountId;
    if (!accountId) {
      const reserved = await reserveEscrowForAssignment({
        campaignId: row.campaignId,
        assignmentId: row.assignmentId,
        amountMinor: row.amountMinor,
        currency: row.currency,
      });
      accountId = reserved.account.id;
      await prisma.settlement.update({
        where: { id: row.id },
        data: { escrowAccountId: accountId },
      });
    }

    const released = await releaseEscrowAccount({
      accountId,
      amountMinor: row.amountMinor,
      feeMinor: row.feeMinor,
      currency: row.currency,
      workerWalletId: row.workerWalletId,
      campaignId: row.campaignId,
      assignmentId: row.assignmentId,
      submissionId: row.submissionId,
      reviewDecisionId: row.reviewDecisionId,
      settlementId: row.id,
      idempotencyKey: `escrow_release:${row.idempotencyKey}`,
    });

    const txn = await prisma.financialTransaction.findUnique({
      where: { publicId: released.transactionPublicId },
      select: { id: true },
    });

    const updated = await prisma.settlement.update({
      where: { id: row.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        ledgerTransactionId: txn?.id ?? null,
      },
    });

    await projectWallet(row.workerWalletId);
    const mapped = mapSettlement(updated);
    const [worker, campaign] = await Promise.all([
      prisma.user.findUnique({
        where: { id: row.workerUserId },
        select: {
          email: true,
          phone: true,
          profile: { select: { displayName: true } },
        },
      }),
      prisma.campaign.findUnique({
        where: { id: row.campaignId },
        select: { organizationId: true, name: true },
      }),
    ]);
    await safeEmitDomainNotification({
      event: "settlement.completed",
      organizationId: campaign?.organizationId ?? null,
      actorUserId: row.workerUserId,
      recipients: [
        {
          role: "worker",
          userId: row.workerUserId,
          email: worker?.email ?? null,
          phone: worker?.phone ?? null,
          displayName: worker?.profile?.displayName ?? null,
        },
      ],
      variables: {
        recipientName: worker?.profile?.displayName ?? "there",
        organizationName: campaign?.name ?? "Zolanzo",
        publicRef: mapped.publicId,
        amountLabel: `${(row.amountMinor / 100).toFixed(2)} ${row.currency}`,
      },
      idempotencyKey: `settlement.completed:${mapped.publicId}`,
      channels: ["email", "sms", "in_app"],
      span: "settlement.release",
    });
    const { safeRecordTrustEvent } = await import("@/lib/trust/safe-emit");
    await safeRecordTrustEvent({
      subjectType: "worker",
      subjectId: row.workerUserId,
      eventType: "payment_settled",
      idempotencyKey: `trust:payment_settled:${mapped.publicId}`,
      payload: { settlementPublicId: mapped.publicId },
      span: "settlement.release.trust",
    });
    const { safeRecordAnalyticsEvent } = await import(
      "@/lib/analytics/safe-emit"
    );
    await safeRecordAnalyticsEvent({
      source: "payments",
      eventType: "payment.completed",
      idempotencyKey: `analytics:payment.completed:${mapped.publicId}`,
      entityType: "settlement",
      entityId: mapped.publicId,
      userId: row.workerUserId,
      organizationId: campaign?.organizationId ?? null,
      metricValue: row.amountMinor,
      payload: {
        settlementPublicId: mapped.publicId,
        amountMinor: row.amountMinor,
        currency: row.currency,
      },
      span: "settlement.release.analytics",
    });
    const { safeRecordAutomationEvent } = await import(
      "@/lib/automation/safe-emit"
    );
    await safeRecordAutomationEvent({
      trigger: "payment.settled",
      idempotencyKey: `automation:payment.settled:${mapped.publicId}`,
      userId: row.workerUserId,
      organizationId: campaign?.organizationId ?? null,
      payload: {
        paymentId: mapped.publicId,
        userId: row.workerUserId,
        amountMinor: row.amountMinor,
        paymentStatus: "completed",
      },
      span: "settlement.release.automation",
    });
    return mapped;
  } catch (error) {
    await prisma.settlement.update({
      where: { id: row.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export const createSettlementFromReviewSchema = z.object({
  reviewDecisionPublicId: z.string().min(1),
  policyKey: z.enum(SETTLEMENT_POLICY_KEYS).optional(),
  feeMinor: z.number().int().nonnegative().optional(),
});

export async function createSettlementFromReview(params: {
  input: unknown;
}): Promise<ApiResponse<SettlementRecord>> {
  try {
    const parsed = createSettlementFromReviewSchema.parse(params.input);
    const decisionPkg = await reviewRepository.findDecisionByPublicId(
      parsed.reviewDecisionPublicId,
    );
    if (!decisionPkg) {
      throw new AppError("NOT_FOUND", "Review decision not found", 404);
    }
    const { decision } = decisionPkg;
    if (
      decision.outcome !== "approved" &&
      decision.outcome !== "approved_with_warning"
    ) {
      throw new AppError(
        "NOT_APPROVED",
        `Settlement requires approval (got ${decision.outcome})`,
        400,
      );
    }

    const idempotencyKey = `settlement:review:${decision.id}`;
    const existing = await prisma.settlement.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return apiSuccess(mapSettlement(existing));
    }

    const submission = await submissionRepository.findById(decision.submissionId);
    if (!submission) {
      throw new AppError("SUBMISSION_NOT_FOUND", "Submission not found", 404);
    }
    const assignment = await assignmentRepository.findById(submission.assignmentId);
    if (!assignment) {
      throw new AppError("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
    }

    const snapshot = await ensureEscrowSnapshotForCampaign({
      campaignId: assignment.campaignId,
    });
    const policyKey =
      parsed.policyKey ??
      resolvePolicyKey(
        (submission.metadata as Record<string, unknown> | null) ?? null,
        snapshot.settlementPolicyKey,
      );
    const policy = getSettlementPolicy(policyKey);
    const policyRow = await prisma.settlementPolicy.findUnique({
      where: { key: policyKey },
      select: { id: true },
    });

    const amountMinor =
      (assignment.executionContext?.rewardSnapshot?.rewardPerUnitMinor as
        | number
        | undefined) ?? snapshot.rewardPerUnitMinor;
    const feeMinor = parsed.feeMinor ?? 0;
    const netMinor = amountMinor - feeMinor;
    const currency = snapshot.currency;

    const wallet = await ensureWorkerWallet({
      ownerUserId: submission.workerUserId,
      currency,
    });

    const reserved = await reserveEscrowForAssignment({
      campaignId: assignment.campaignId,
      assignmentId: assignment.id,
      amountMinor,
      currency,
    });

    let status: SettlementStatus = "pending";
    let scheduledAt: Date | null = null;
    let batchId: string | null = null;

    if (policy.requiresManualApproval) {
      status = "pending";
    } else if (policy.waitForCampaignCompletion) {
      status = "scheduled";
      scheduledAt = null;
    } else if (policy.holdDays > 0) {
      status = "scheduled";
      scheduledAt = new Date(Date.now() + policy.holdDays * 24 * 3600 * 1000);
    } else if (policy.batchMode === "daily" || policy.batchMode === "weekly") {
      status = "scheduled";
      const batch = await findOrCreateBatch({
        batchMode: policy.batchMode,
        currency,
      });
      batchId = batch.id;
      await prisma.settlementBatch.update({
        where: { id: batch.id },
        data: {
          totalMinor: { increment: netMinor },
          itemCount: { increment: 1 },
        },
      });
    } else {
      status = "pending";
    }

    const publicId = await generatePublicId("settlement");
    const created = await prisma.settlement.create({
      data: {
        publicId,
        status,
        policyKey,
        policyId: policyRow?.id ?? null,
        policySnapshot: policy as unknown as Prisma.InputJsonValue,
        campaignId: assignment.campaignId,
        assignmentId: assignment.id,
        submissionId: submission.id,
        reviewDecisionId: decision.id,
        workerUserId: submission.workerUserId,
        workerWalletId: wallet.id,
        escrowSnapshotId: snapshot.id,
        escrowAccountId: reserved.account.id,
        batchId,
        amountMinor,
        feeMinor,
        netMinor,
        currency,
        rewardSnapshot: {
          rewardPerUnitMinor: amountMinor,
          currency,
        },
        idempotencyKey,
        scheduledAt,
        metadata: {
          reviewDecisionPublicId: decision.publicId,
          reviewOutcome: decision.outcome,
        },
      },
    });

    // Immediate path: process now
    if (
      status === "pending" &&
      !policy.requiresManualApproval &&
      policy.batchMode === "none" &&
      !policy.waitForCampaignCompletion &&
      policy.holdDays === 0
    ) {
      const completed = await processSettlementRelease(created.id);
      return apiSuccess(completed);
    }

    await projectWallet(wallet.id);
    return apiSuccess(mapSettlement(created));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "SETTLEMENT_CREATE_FAILED",
      error instanceof Error ? error.message : "Could not create settlement",
    );
  }
}

export const processSettlementSchema = z.object({
  settlementPublicId: z.string().min(1),
});

export async function processSettlement(params: {
  input: unknown;
}): Promise<ApiResponse<SettlementRecord>> {
  try {
    const parsed = processSettlementSchema.parse(params.input);
    const row = await prisma.settlement.findUnique({
      where: { publicId: parsed.settlementPublicId },
    });
    if (!row) throw new AppError("NOT_FOUND", "Settlement not found", 404);
    const completed = await processSettlementRelease(row.id);
    return apiSuccess(completed);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "SETTLEMENT_PROCESS_FAILED",
      error instanceof Error ? error.message : "Could not process settlement",
    );
  }
}

export const processBatchSchema = z.object({
  batchPublicId: z.string().min(1),
});

export async function processSettlementBatch(params: {
  input: unknown;
}): Promise<
  ApiResponse<{
    batchPublicId: string;
    status: string;
    processed: number;
    failed: number;
  }>
> {
  try {
    const parsed = processBatchSchema.parse(params.input);
    const batch = await prisma.settlementBatch.findUnique({
      where: { publicId: parsed.batchPublicId },
    });
    if (!batch) throw new AppError("NOT_FOUND", "Batch not found", 404);

    await prisma.settlementBatch.update({
      where: { id: batch.id },
      data: { status: "processing", processingAt: new Date() },
    });

    const items = await prisma.settlement.findMany({
      where: {
        batchId: batch.id,
        status: { in: ["pending", "scheduled"] },
      },
    });

    let processed = 0;
    let failed = 0;
    for (const item of items) {
      try {
        await processSettlementRelease(item.id);
        processed += 1;
      } catch {
        failed += 1;
      }
    }

    const status = failed > 0 && processed === 0 ? "failed" : "completed";
    await prisma.settlementBatch.update({
      where: { id: batch.id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
        failedAt: status === "failed" ? new Date() : null,
      },
    });

    return apiSuccess({
      batchPublicId: batch.publicId,
      status,
      processed,
      failed,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "BATCH_PROCESS_FAILED",
      error instanceof Error ? error.message : "Could not process batch",
    );
  }
}

export async function cancelSettlementForRejectedReview(params: {
  reviewDecisionPublicId: string;
}): Promise<ApiResponse<{ cancelled: boolean }>> {
  try {
    const decisionPkg = await reviewRepository.findDecisionByPublicId(
      params.reviewDecisionPublicId,
    );
    if (!decisionPkg) {
      throw new AppError("NOT_FOUND", "Review decision not found", 404);
    }
    if (
      decisionPkg.decision.outcome !== "rejected" &&
      decisionPkg.decision.outcome !== "revision_requested"
    ) {
      return apiSuccess({ cancelled: false });
    }

    const submission = await submissionRepository.findById(
      decisionPkg.decision.submissionId,
    );
    if (!submission) return apiSuccess({ cancelled: false });

    const account = await prisma.escrowAccount.findFirst({
      where: { assignmentId: submission.assignmentId, status: "reserved" },
    });
    if (account) {
      await cancelEscrowAccount({
        accountId: account.id,
        amountMinor: account.amountMinor,
        currency: account.currency,
        campaignId: account.campaignId,
        assignmentId: submission.assignmentId,
        idempotencyKey: `escrow_refund:review:${decisionPkg.decision.id}`,
      });
    }
    return apiSuccess({ cancelled: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CANCEL_FAILED",
      error instanceof Error ? error.message : "Could not cancel escrow",
    );
  }
}

export type { SettlementPolicyDefinition };
