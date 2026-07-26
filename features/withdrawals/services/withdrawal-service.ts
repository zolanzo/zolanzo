/**
 * Withdrawal Engine — Intent → Eligibility → Reservation → WDR → Approval → Ledger.
 * Never mutates wallet balances directly.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  DESTINATION_ACCOUNT_KIND_STATUS,
  WITHDRAWAL_POLICY_KEYS,
  WITHDRAWAL_REQUEST_TRANSITIONS,
  type DestinationAccountKind,
  type WithdrawalPolicyKey,
  type WithdrawalRequestStatus,
} from "@/constants/finance-enums";
import {
  getWithdrawalPolicy,
  type WithdrawalPolicyDefinition,
} from "@/constants/withdrawal-policies";
import { postLedgerTransaction } from "@/features/ledger/services/posting";
import {
  ensureWorkerWallet,
  projectWallet,
  type WalletProjectionView,
} from "@/features/wallet/services/projection";
import {
  evaluateWithdrawalEligibility,
  requiresManualApproval,
  type EligibilityResult,
} from "@/features/withdrawals/services/eligibility";
import { z } from "zod";

function canTransition(
  from: WithdrawalRequestStatus,
  to: WithdrawalRequestStatus,
): boolean {
  return WITHDRAWAL_REQUEST_TRANSITIONS[from].includes(to);
}

function periodKeyFor(mode: "daily" | "weekly", now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  if (mode === "daily") return `${y}-${m}-${d}`;
  const start = Date.UTC(y, 0, 1);
  const week = Math.floor((now.getTime() - start) / (7 * 24 * 3600 * 1000)) + 1;
  return `${y}-W${String(week).padStart(2, "0")}`;
}

export type WithdrawalRequestRecord = {
  id: string;
  publicId: string;
  status: WithdrawalRequestStatus;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  policyKey: WithdrawalPolicyKey;
  walletId: string;
  batchId: string | null;
  ledgerTransactionId: string | null;
  createdAt: string;
};

function mapRequest(row: {
  id: string;
  publicId: string;
  status: string;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  policyKey: string;
  walletId: string;
  batchId: string | null;
  ledgerTransactionId: string | null;
  createdAt: Date;
}): WithdrawalRequestRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    status: row.status as WithdrawalRequestStatus,
    amountMinor: row.amountMinor,
    feeMinor: row.feeMinor,
    netMinor: row.netMinor,
    currency: row.currency,
    policyKey: row.policyKey as WithdrawalPolicyKey,
    walletId: row.walletId,
    batchId: row.batchId,
    ledgerTransactionId: row.ledgerTransactionId,
    createdAt: row.createdAt.toISOString(),
  };
}

async function activeReserved(walletId: string): Promise<number> {
  const agg = await prisma.withdrawalReservation.aggregate({
    where: { walletId, status: "active" },
    _sum: { amountMinor: true },
  });
  return agg._sum.amountMinor ?? 0;
}

async function hoursSinceLastCompleted(
  workerUserId: string,
): Promise<number | null> {
  const last = await prisma.withdrawalRequest.findFirst({
    where: { workerUserId, status: "completed" },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });
  if (!last?.completedAt) return null;
  return (Date.now() - last.completedAt.getTime()) / (3600 * 1000);
}

async function findOrCreateWithdrawalBatch(params: {
  batchMode: "daily" | "weekly";
  currency: string;
}): Promise<{ id: string; publicId: string }> {
  const periodKey = periodKeyFor(params.batchMode);
  const existing = await prisma.withdrawalBatch.findUnique({
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
  const publicId = await generatePublicId("withdrawal_batch");
  return prisma.withdrawalBatch.create({
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

async function releaseReservation(
  requestId: string,
  status: "released" | "consumed",
): Promise<void> {
  await prisma.withdrawalReservation.updateMany({
    where: { requestId, status: "active" },
    data: { status, releasedAt: new Date() },
  });
}

export const upsertDestinationSchema = z.object({
  kind: z.enum(["bank_account", "mobile_money", "digital_wallet", "crypto_wallet"]),
  label: z.string().min(1).max(120),
  currency: z.string().length(3),
  details: z.record(z.string(), z.unknown()),
  verified: z.boolean().optional(),
  organizationId: z.string().optional().nullable(),
});

export async function upsertDestinationAccount(params: {
  input: unknown;
  workerUserId: string;
}): Promise<
  ApiResponse<{
    id: string;
    kind: DestinationAccountKind;
    label: string;
    verified: boolean;
  }>
> {
  try {
    const parsed = upsertDestinationSchema.parse(params.input);
    if (DESTINATION_ACCOUNT_KIND_STATUS[parsed.kind] !== "active") {
      throw new AppError(
        "DESTINATION_PLACEHOLDER",
        `${parsed.kind} is not active yet`,
        400,
      );
    }
    const row = await prisma.destinationAccount.create({
      data: {
        workerUserId: params.workerUserId,
        organizationId: parsed.organizationId ?? null,
        kind: parsed.kind,
        label: parsed.label,
        currency: parsed.currency.toUpperCase(),
        details: parsed.details as Prisma.InputJsonValue,
        verified: parsed.verified ?? false,
      },
    });
    return apiSuccess({
      id: row.id,
      kind: row.kind as DestinationAccountKind,
      label: row.label,
      verified: row.verified,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "DESTINATION_FAILED",
      error instanceof Error ? error.message : "Could not save destination",
    );
  }
}

export const createIntentSchema = z.object({
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  destinationAccountId: z.string().min(1),
  policyKey: z.enum(WITHDRAWAL_POLICY_KEYS).optional(),
  organizationId: z.string().optional().nullable(),
  feeMinor: z.number().int().nonnegative().optional(),
});

export type WithdrawalIntentView = {
  id: string;
  status: string;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  policyKey: WithdrawalPolicyKey;
  eligibility: EligibilityResult;
  projection: WalletProjectionView;
  expiresAt: string;
  estimatedProcessAt: string | null;
};

export async function createWithdrawalIntent(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<WithdrawalIntentView>> {
  try {
    const parsed = createIntentSchema.parse(params.input);
    const currency = parsed.currency.toUpperCase();
    const feeMinor = parsed.feeMinor ?? 0;
    const netMinor = parsed.amountMinor - feeMinor;
    if (netMinor <= 0) {
      throw new AppError("INVALID_AMOUNT", "Net amount must be positive", 400);
    }

    const destination = await prisma.destinationAccount.findFirst({
      where: {
        id: parsed.destinationAccountId,
        workerUserId: params.workerUserId,
        active: true,
      },
    });
    if (!destination) {
      throw new AppError("DESTINATION_NOT_FOUND", "Destination not found", 404);
    }

    const policyKey = parsed.policyKey ?? "immediate";
    const policy = getWithdrawalPolicy(policyKey);
    const wallet = await ensureWorkerWallet({
      ownerUserId: params.workerUserId,
      currency,
    });
    const projection = await projectWallet(wallet.id);
    const reservedMinor = await activeReserved(wallet.id);
    const pendingSettlementsMinor = projection.pendingMinor;
    const outstandingReviewCount = await prisma.reviewQueueItem.count({
      where: {
        status: { in: ["pending", "assigned", "in_review", "escalated"] },
        submission: { workerUserId: params.workerUserId },
      },
    });

    const eligibility = evaluateWithdrawalEligibility({
      amountMinor: parsed.amountMinor,
      feeMinor,
      policy,
      projection,
      reservedMinor,
      pendingSettlementsMinor,
      outstandingReviewCount,
      destinationVerified: destination.verified,
      destinationKindActive:
        DESTINATION_ACCOUNT_KIND_STATUS[
          destination.kind as DestinationAccountKind
        ] === "active",
      hoursSinceLastCompleted: await hoursSinceLastCompleted(params.workerUserId),
      accountVerificationLevel: "email",
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const estimatedProcessAt =
      policy.batchMode === "none"
        ? new Date(Date.now() + 60 * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const intent = await prisma.withdrawalIntent.create({
      data: {
        workerUserId: params.workerUserId,
        walletId: wallet.id,
        destinationAccountId: destination.id,
        organizationId: parsed.organizationId ?? null,
        amountMinor: parsed.amountMinor,
        feeMinor,
        netMinor,
        currency,
        policyKey,
        status: "open",
        eligibilitySnapshot: eligibility as unknown as Prisma.InputJsonValue,
        projectionSnapshot: projection as unknown as Prisma.InputJsonValue,
        estimatedProcessAt,
        expiresAt,
      },
    });

    return apiSuccess({
      id: intent.id,
      status: intent.status,
      amountMinor: intent.amountMinor,
      feeMinor: intent.feeMinor,
      netMinor: intent.netMinor,
      currency: intent.currency,
      policyKey,
      eligibility,
      projection,
      expiresAt: expiresAt.toISOString(),
      estimatedProcessAt: estimatedProcessAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "INTENT_FAILED",
      error instanceof Error ? error.message : "Could not create intent",
    );
  }
}

export const confirmIntentSchema = z.object({
  intentId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(128),
});

export async function confirmWithdrawalIntent(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<WithdrawalRequestRecord>> {
  try {
    const parsed = confirmIntentSchema.parse(params.input);

    const existing = await prisma.withdrawalRequest.findUnique({
      where: { idempotencyKey: parsed.idempotencyKey },
    });
    if (existing) return apiSuccess(mapRequest(existing));

    const intent = await prisma.withdrawalIntent.findFirst({
      where: {
        id: parsed.intentId,
        workerUserId: params.workerUserId,
        status: "open",
      },
    });
    if (!intent) {
      throw new AppError("INTENT_NOT_FOUND", "Intent not found or not open", 404);
    }
    if (intent.expiresAt.getTime() < Date.now()) {
      await prisma.withdrawalIntent.update({
        where: { id: intent.id },
        data: { status: "expired" },
      });
      throw new AppError("INTENT_EXPIRED", "Intent expired", 400);
    }

    const eligibility = intent.eligibilitySnapshot as unknown as EligibilityResult;
    if (!eligibility.eligible) {
      throw new AppError("NOT_ELIGIBLE", "Intent failed eligibility", 400, {
        checks: eligibility.checks,
      });
    }

    const policy = getWithdrawalPolicy(intent.policyKey as WithdrawalPolicyKey);
    const projection = await projectWallet(intent.walletId);
    const reservedMinor = await activeReserved(intent.walletId);
    const destination = await prisma.destinationAccount.findUnique({
      where: { id: intent.destinationAccountId },
    });
    if (!destination) {
      throw new AppError("DESTINATION_NOT_FOUND", "Destination missing", 404);
    }

    // Re-check eligibility at confirm time
    const recheck = evaluateWithdrawalEligibility({
      amountMinor: intent.amountMinor,
      feeMinor: intent.feeMinor,
      policy,
      projection,
      reservedMinor,
      pendingSettlementsMinor: projection.pendingMinor,
      outstandingReviewCount: await prisma.reviewQueueItem.count({
        where: {
          status: { in: ["pending", "assigned", "in_review", "escalated"] },
          submission: { workerUserId: params.workerUserId },
        },
      }),
      destinationVerified: destination.verified,
      destinationKindActive:
        DESTINATION_ACCOUNT_KIND_STATUS[
          destination.kind as DestinationAccountKind
        ] === "active",
      hoursSinceLastCompleted: await hoursSinceLastCompleted(params.workerUserId),
      accountVerificationLevel: "email",
    });
    if (!recheck.eligible) {
      throw new AppError("NOT_ELIGIBLE", "No longer eligible", 400, {
        checks: recheck.checks,
      });
    }

    const needsApproval = requiresManualApproval(policy, intent.amountMinor);
    let status: WithdrawalRequestStatus = needsApproval
      ? "pending_approval"
      : "approved";
    let batchId: string | null = null;
    let scheduledAt: Date | null = null;

    if (!needsApproval && (policy.batchMode === "daily" || policy.batchMode === "weekly")) {
      status = "scheduled";
      const batch = await findOrCreateWithdrawalBatch({
        batchMode: policy.batchMode,
        currency: intent.currency,
      });
      batchId = batch.id;
      scheduledAt = new Date();
      await prisma.withdrawalBatch.update({
        where: { id: batch.id },
        data: {
          totalMinor: { increment: intent.netMinor },
          itemCount: { increment: 1 },
          status: "scheduled",
          scheduledAt: new Date(),
        },
      });
    } else if (!needsApproval && policy.batchMode === "none") {
      status = "approved";
    }

    const policyRow = await prisma.withdrawalPolicy.findUnique({
      where: { key: policy.key },
      select: { id: true },
    });

    const complianceSnapshot = {
      workerUserId: params.workerUserId,
      organizationId: intent.organizationId,
      policyKey: policy.key,
      limits: {
        minAmountMinor: policy.minAmountMinor,
        maxAmountMinor: policy.maxAmountMinor,
        minimumBalanceMinor: policy.minimumBalanceMinor,
        coolingPeriodHours: policy.coolingPeriodHours,
      },
      destinationAccountId: destination.id,
      destinationKind: destination.kind,
      destinationVerified: destination.verified,
      riskScore: null,
      identityStatus: "email",
      capturedAt: new Date().toISOString(),
    };

    const publicId = await generatePublicId("withdrawal");
    const request = await prisma.withdrawalRequest.create({
      data: {
        publicId,
        workerUserId: params.workerUserId,
        organizationId: intent.organizationId,
        walletId: intent.walletId,
        destinationAccountId: intent.destinationAccountId,
        policyKey: policy.key,
        policyId: policyRow?.id ?? null,
        policySnapshot: policy as unknown as Prisma.InputJsonValue,
        projectionSnapshot: projection as unknown as Prisma.InputJsonValue,
        complianceSnapshot: complianceSnapshot as unknown as Prisma.InputJsonValue,
        settlementReferences: [],
        amountMinor: intent.amountMinor,
        feeMinor: intent.feeMinor,
        netMinor: intent.netMinor,
        currency: intent.currency,
        status,
        batchId,
        idempotencyKey: parsed.idempotencyKey,
        scheduledAt,
        reservation: {
          create: {
            walletId: intent.walletId,
            amountMinor: intent.amountMinor,
            currency: intent.currency,
            status: "active",
          },
        },
      },
    });

    await prisma.withdrawalIntent.update({
      where: { id: intent.id },
      data: { status: "converted", convertedRequestId: request.id },
    });

    await projectWallet(intent.walletId);

    // Immediate policy: approved + no batch → complete via ledger now
    if (status === "approved" && policy.batchMode === "none") {
      const completed = await completeWithdrawalLedger(request.id);
      return apiSuccess(completed);
    }

    return apiSuccess(mapRequest(request));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CONFIRM_FAILED",
      error instanceof Error ? error.message : "Could not confirm withdrawal",
    );
  }
}

export const approveWithdrawalSchema = z.object({
  withdrawalPublicId: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  comments: z.string().max(2000).optional().nullable(),
});

export async function recordWithdrawalApproval(params: {
  input: unknown;
  approverUserId: string;
}): Promise<ApiResponse<WithdrawalRequestRecord>> {
  try {
    const parsed = approveWithdrawalSchema.parse(params.input);
    const request = await prisma.withdrawalRequest.findUnique({
      where: { publicId: parsed.withdrawalPublicId },
    });
    if (!request) throw new AppError("NOT_FOUND", "Withdrawal not found", 404);

    if (request.status !== "pending_approval" && request.status !== "pending") {
      throw new AppError(
        "INVALID_STATUS",
        `Cannot approve from status ${request.status}`,
        400,
      );
    }

    await prisma.withdrawalApproval.create({
      data: {
        requestId: request.id,
        approverUserId: params.approverUserId,
        decision: parsed.decision,
        step: 1,
        comments: parsed.comments ?? null,
      },
    });

    if (parsed.decision === "rejected") {
      if (!canTransition(request.status as WithdrawalRequestStatus, "rejected")) {
        throw new AppError("INVALID_TRANSITION", "Cannot reject", 400);
      }
      const updated = await prisma.withdrawalRequest.update({
        where: { id: request.id },
        data: { status: "rejected" },
      });
      await releaseReservation(request.id, "released");
      await projectWallet(request.walletId);
      return apiSuccess(mapRequest(updated));
    }

    const policy = request.policySnapshot as unknown as WithdrawalPolicyDefinition;
    let next: WithdrawalRequestStatus = "approved";
    let batchId = request.batchId;
    if (policy.batchMode === "daily" || policy.batchMode === "weekly") {
      next = "scheduled";
      if (!batchId) {
        const batch = await findOrCreateWithdrawalBatch({
          batchMode: policy.batchMode,
          currency: request.currency,
        });
        batchId = batch.id;
        await prisma.withdrawalBatch.update({
          where: { id: batch.id },
          data: {
            totalMinor: { increment: request.netMinor },
            itemCount: { increment: 1 },
            status: "scheduled",
            scheduledAt: new Date(),
          },
        });
      }
    }

    if (!canTransition(request.status as WithdrawalRequestStatus, next)) {
      throw new AppError("INVALID_TRANSITION", `Cannot move to ${next}`, 400);
    }

    const updated = await prisma.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: next,
        batchId,
        scheduledAt: next === "scheduled" ? new Date() : request.scheduledAt,
      },
    });
    return apiSuccess(mapRequest(updated));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "APPROVAL_FAILED",
      error instanceof Error ? error.message : "Could not record approval",
    );
  }
}

async function completeWithdrawalLedger(
  requestId: string,
): Promise<WithdrawalRequestRecord> {
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new AppError("NOT_FOUND", "Withdrawal not found", 404);
  if (request.status === "completed") return mapRequest(request);

  const from = request.status as WithdrawalRequestStatus;
  if (from !== "processing") {
    if (!canTransition(from, "processing")) {
      throw new AppError(
        "INVALID_STATUS",
        `Cannot process from ${from}`,
        400,
      );
    }
    await prisma.withdrawalRequest.update({
      where: { id: request.id },
      data: { status: "processing", processingAt: new Date() },
    });
  }

  try {
    // Completion posts ledger — approval never moved money
    const posted = await postLedgerTransaction({
      type: "withdrawal_request",
      amountMinor: request.amountMinor,
      feeMinor: 0,
      netMinor: request.amountMinor,
      currency: request.currency,
      idempotencyKey: `withdrawal_complete:${request.idempotencyKey}`,
      sourceWalletId: request.walletId,
      workerWalletId: request.walletId,
      organizationId: request.organizationId,
      memo: `Withdrawal ${request.publicId}`,
      metadata: { withdrawalPublicId: request.publicId },
    });

    if (request.feeMinor > 0) {
      await postLedgerTransaction({
        type: "withdrawal_fee",
        amountMinor: request.feeMinor,
        feeMinor: request.feeMinor,
        netMinor: request.feeMinor,
        currency: request.currency,
        idempotencyKey: `withdrawal_fee:${request.idempotencyKey}`,
        workerWalletId: request.walletId,
        memo: `Withdrawal fee ${request.publicId}`,
      });
    }

    const txn = await prisma.financialTransaction.findUnique({
      where: { publicId: posted.transactionPublicId },
      select: { id: true },
    });

    const updated = await prisma.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        ledgerTransactionId: txn?.id ?? null,
      },
    });
    await releaseReservation(request.id, "consumed");
    await projectWallet(request.walletId);
    return mapRequest(updated);
  } catch (error) {
    await prisma.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : "Unknown",
      },
    });
    await releaseReservation(request.id, "released");
    await projectWallet(request.walletId);
    throw error;
  }
}

export const processWithdrawalSchema = z.object({
  withdrawalPublicId: z.string().min(1),
});

export async function processWithdrawal(params: {
  input: unknown;
}): Promise<ApiResponse<WithdrawalRequestRecord>> {
  try {
    const parsed = processWithdrawalSchema.parse(params.input);
    const request = await prisma.withdrawalRequest.findUnique({
      where: { publicId: parsed.withdrawalPublicId },
    });
    if (!request) throw new AppError("NOT_FOUND", "Withdrawal not found", 404);
    const completed = await completeWithdrawalLedger(request.id);
    return apiSuccess(completed);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PROCESS_FAILED",
      error instanceof Error ? error.message : "Could not process withdrawal",
    );
  }
}

export const cancelWithdrawalSchema = z.object({
  withdrawalPublicId: z.string().min(1),
});

export async function cancelWithdrawal(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<WithdrawalRequestRecord>> {
  try {
    const parsed = cancelWithdrawalSchema.parse(params.input);
    const request = await prisma.withdrawalRequest.findFirst({
      where: {
        publicId: parsed.withdrawalPublicId,
        workerUserId: params.workerUserId,
      },
    });
    if (!request) throw new AppError("NOT_FOUND", "Withdrawal not found", 404);
    const from = request.status as WithdrawalRequestStatus;
    if (!canTransition(from, "cancelled")) {
      throw new AppError("INVALID_STATUS", `Cannot cancel from ${from}`, 400);
    }
    const updated = await prisma.withdrawalRequest.update({
      where: { id: request.id },
      data: { status: "cancelled" },
    });
    await releaseReservation(request.id, "released");
    await projectWallet(request.walletId);
    return apiSuccess(mapRequest(updated));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CANCEL_FAILED",
      error instanceof Error ? error.message : "Could not cancel withdrawal",
    );
  }
}

export const processWithdrawalBatchSchema = z.object({
  batchPublicId: z.string().min(1),
});

export async function processWithdrawalBatch(params: {
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
    const parsed = processWithdrawalBatchSchema.parse(params.input);
    const batch = await prisma.withdrawalBatch.findUnique({
      where: { publicId: parsed.batchPublicId },
    });
    if (!batch) throw new AppError("NOT_FOUND", "Batch not found", 404);

    await prisma.withdrawalBatch.update({
      where: { id: batch.id },
      data: { status: "processing", processingAt: new Date() },
    });

    const items = await prisma.withdrawalRequest.findMany({
      where: {
        batchId: batch.id,
        status: { in: ["approved", "scheduled"] },
      },
    });

    let processed = 0;
    let failed = 0;
    for (const item of items) {
      try {
        await completeWithdrawalLedger(item.id);
        processed += 1;
      } catch {
        failed += 1;
      }
    }

    const status = failed > 0 && processed === 0 ? "failed" : "completed";
    await prisma.withdrawalBatch.update({
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
      "BATCH_FAILED",
      error instanceof Error ? error.message : "Could not process batch",
    );
  }
}
