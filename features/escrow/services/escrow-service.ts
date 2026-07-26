/**
 * Escrow snapshots + account lifecycle.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  SETTLEMENT_POLICY_KEYS,
  type SettlementPolicyKey,
} from "@/constants/finance-enums";
import {
  getSettlementPolicy,
  type SettlementPolicyDefinition,
} from "@/constants/settlement-policies";
import { postLedgerTransaction } from "@/features/ledger/services/posting";
import { AppError } from "@/lib/api/response";
import { BaseRepository } from "@/repositories/base";

export type EscrowSnapshotRecord = {
  id: string;
  publicId: string;
  campaignId: string;
  currency: string;
  budgetMinor: number;
  rewardPerUnitMinor: number;
  targetQuantity: number;
  campaignRevisionAt: string;
  settlementPolicyKey: SettlementPolicyKey;
  policySnapshot: SettlementPolicyDefinition;
  rewardSnapshot: Record<string, unknown>;
  budgetSnapshot: Record<string, unknown>;
  capturedAt: string;
};

export type EscrowAccountRecord = {
  id: string;
  snapshotId: string;
  campaignId: string;
  assignmentId: string | null;
  currency: string;
  amountMinor: number;
  reservedMinor: number;
  releasedMinor: number;
  cancelledMinor: number;
  status: string;
};

function resolveSettlementPolicyKey(
  metadata: Record<string, unknown> | null,
): SettlementPolicyKey {
  const key = metadata?.settlementPolicyKey;
  if (
    typeof key === "string" &&
    (SETTLEMENT_POLICY_KEYS as readonly string[]).includes(key)
  ) {
    return key as SettlementPolicyKey;
  }
  return "immediate";
}

class EscrowRepository extends BaseRepository {
  async findLatestSnapshot(
    campaignId: string,
  ): Promise<EscrowSnapshotRecord | null> {
    const row = await prisma.escrowSnapshot.findFirst({
      where: { campaignId },
      orderBy: { capturedAt: "desc" },
    });
    if (!row) return null;
    return {
      id: row.id,
      publicId: row.publicId,
      campaignId: row.campaignId,
      currency: row.currency,
      budgetMinor: row.budgetMinor,
      rewardPerUnitMinor: row.rewardPerUnitMinor,
      targetQuantity: row.targetQuantity,
      campaignRevisionAt: row.campaignRevisionAt,
      settlementPolicyKey: row.settlementPolicyKey as SettlementPolicyKey,
      policySnapshot: row.policySnapshot as unknown as SettlementPolicyDefinition,
      rewardSnapshot: row.rewardSnapshot as Record<string, unknown>,
      budgetSnapshot: row.budgetSnapshot as Record<string, unknown>,
      capturedAt: row.capturedAt.toISOString(),
    };
  }

  async findAccountByAssignment(
    assignmentId: string,
  ): Promise<EscrowAccountRecord | null> {
    const row = await prisma.escrowAccount.findFirst({
      where: { assignmentId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return {
      id: row.id,
      snapshotId: row.snapshotId,
      campaignId: row.campaignId,
      assignmentId: row.assignmentId,
      currency: row.currency,
      amountMinor: row.amountMinor,
      reservedMinor: row.reservedMinor,
      releasedMinor: row.releasedMinor,
      cancelledMinor: row.cancelledMinor,
      status: row.status,
    };
  }

  async createSnapshot(params: {
    campaignId: string;
    currency: string;
    budgetMinor: number;
    rewardPerUnitMinor: number;
    targetQuantity: number;
    campaignRevisionAt: string;
    settlementPolicyKey: SettlementPolicyKey;
    metadata?: Record<string, unknown> | null;
  }): Promise<EscrowSnapshotRecord> {
    const policy = getSettlementPolicy(params.settlementPolicyKey);
    const publicId = await generatePublicId("escrow_snapshot");
    await prisma.escrowSnapshot.create({
      data: {
        publicId,
        campaignId: params.campaignId,
        currency: params.currency,
        budgetMinor: params.budgetMinor,
        rewardPerUnitMinor: params.rewardPerUnitMinor,
        targetQuantity: params.targetQuantity,
        campaignRevisionAt: params.campaignRevisionAt,
        settlementPolicyKey: params.settlementPolicyKey,
        policySnapshot: policy as unknown as Prisma.InputJsonValue,
        rewardSnapshot: {
          rewardPerUnitMinor: params.rewardPerUnitMinor,
          currency: params.currency,
        },
        budgetSnapshot: {
          budgetMinor: params.budgetMinor,
          targetQuantity: params.targetQuantity,
        },
        metadata: (params.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return (await this.findLatestSnapshot(params.campaignId))!;
  }

  async createAccount(params: {
    snapshotId: string;
    campaignId: string;
    assignmentId: string | null;
    currency: string;
    amountMinor: number;
  }): Promise<EscrowAccountRecord> {
    const row = await prisma.escrowAccount.create({
      data: {
        snapshotId: params.snapshotId,
        campaignId: params.campaignId,
        assignmentId: params.assignmentId,
        currency: params.currency,
        amountMinor: params.amountMinor,
        reservedMinor: params.amountMinor,
        status: "reserved",
      },
    });
    return {
      id: row.id,
      snapshotId: row.snapshotId,
      campaignId: row.campaignId,
      assignmentId: row.assignmentId,
      currency: row.currency,
      amountMinor: row.amountMinor,
      reservedMinor: row.reservedMinor,
      releasedMinor: row.releasedMinor,
      cancelledMinor: row.cancelledMinor,
      status: row.status,
    };
  }

  async markReleased(accountId: string, amountMinor: number): Promise<void> {
    await prisma.escrowAccount.update({
      where: { id: accountId },
      data: {
        status: "released",
        releasedMinor: amountMinor,
        releasedAt: new Date(),
      },
    });
  }

  async markCancelled(accountId: string, amountMinor: number): Promise<void> {
    await prisma.escrowAccount.update({
      where: { id: accountId },
      data: {
        status: "refunded",
        cancelledMinor: amountMinor,
        cancelledAt: new Date(),
      },
    });
  }
}

export const escrowRepository = new EscrowRepository();

export async function ensureEscrowSnapshotForCampaign(params: {
  campaignId: string;
}): Promise<EscrowSnapshotRecord> {
  const existing = await escrowRepository.findLatestSnapshot(params.campaignId);
  if (existing) return existing;

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
  });
  if (!campaign) {
    throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
  }

  const metadata = (campaign.metadata as Record<string, unknown> | null) ?? null;
  return escrowRepository.createSnapshot({
    campaignId: campaign.id,
    currency: campaign.currency,
    budgetMinor: campaign.budgetMinor,
    rewardPerUnitMinor: campaign.rewardPerUnitMinor,
    targetQuantity: campaign.targetQuantity,
    campaignRevisionAt: campaign.updatedAt.toISOString(),
    settlementPolicyKey: resolveSettlementPolicyKey(metadata),
    metadata,
  });
}

export async function reserveEscrowForAssignment(params: {
  campaignId: string;
  assignmentId: string;
  amountMinor: number;
  currency: string;
}): Promise<{ snapshot: EscrowSnapshotRecord; account: EscrowAccountRecord }> {
  const existing = await escrowRepository.findAccountByAssignment(
    params.assignmentId,
  );
  const snapshot = await ensureEscrowSnapshotForCampaign({
    campaignId: params.campaignId,
  });
  if (existing) {
    return { snapshot, account: existing };
  }

  await postLedgerTransaction({
    type: "escrow_reserve",
    amountMinor: params.amountMinor,
    feeMinor: 0,
    netMinor: params.amountMinor,
    currency: params.currency,
    idempotencyKey: `escrow_reserve:${params.assignmentId}`,
    campaignId: params.campaignId,
    assignmentId: params.assignmentId,
    memo: "Reserve escrow for assignment",
  });

  const account = await escrowRepository.createAccount({
    snapshotId: snapshot.id,
    campaignId: params.campaignId,
    assignmentId: params.assignmentId,
    currency: params.currency,
    amountMinor: params.amountMinor,
  });

  return { snapshot, account };
}

export async function releaseEscrowAccount(params: {
  accountId: string;
  amountMinor: number;
  currency: string;
  workerWalletId: string;
  feeMinor?: number;
  campaignId: string;
  assignmentId: string;
  submissionId?: string;
  reviewDecisionId?: string;
  settlementId?: string;
  idempotencyKey: string;
}): Promise<{ transactionPublicId: string }> {
  const fee = params.feeMinor ?? 0;
  const net = params.amountMinor - fee;
  const posted = await postLedgerTransaction({
    type: "escrow_release",
    amountMinor: params.amountMinor,
    feeMinor: fee,
    netMinor: net,
    currency: params.currency,
    idempotencyKey: params.idempotencyKey,
    campaignId: params.campaignId,
    assignmentId: params.assignmentId,
    submissionId: params.submissionId,
    reviewDecisionId: params.reviewDecisionId,
    settlementId: params.settlementId,
    destinationWalletId: params.workerWalletId,
    workerWalletId: params.workerWalletId,
    memo: "Release escrow to worker",
  });
  await escrowRepository.markReleased(params.accountId, params.amountMinor);
  return { transactionPublicId: posted.transactionPublicId };
}

export async function cancelEscrowAccount(params: {
  accountId: string;
  amountMinor: number;
  currency: string;
  campaignId: string;
  assignmentId: string;
  idempotencyKey: string;
}): Promise<void> {
  await postLedgerTransaction({
    type: "escrow_refund",
    amountMinor: params.amountMinor,
    feeMinor: 0,
    netMinor: params.amountMinor,
    currency: params.currency,
    idempotencyKey: params.idempotencyKey,
    campaignId: params.campaignId,
    assignmentId: params.assignmentId,
    memo: "Cancel/refund escrow",
  });
  await escrowRepository.markCancelled(params.accountId, params.amountMinor);
}
