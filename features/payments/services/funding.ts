/**
 * Funding integration — successful payments → ledger → campaign escrow snapshot.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { postLedgerTransaction } from "@/features/ledger/services/posting";
import { ensureEscrowSnapshotForCampaign } from "@/features/escrow/services/escrow-service";

export async function applySuccessfulFunding(params: {
  paymentIntentId: string;
  paymentPublicId: string;
  amountMinor: number;
  currency: string;
  organizationId: string;
  campaignId: string | null;
  providerKey: string;
  providerRef: string;
  idempotencyKey: string;
}): Promise<{
  captureTransactionId: string;
  fundingTransactionId: string | null;
  escrowSnapshotPublicId: string | null;
}> {
  const capture = await postLedgerTransaction({
    type: "payment_capture",
    amountMinor: params.amountMinor,
    feeMinor: 0,
    netMinor: params.amountMinor,
    currency: params.currency,
    idempotencyKey: `payment_capture:${params.idempotencyKey}`,
    organizationId: params.organizationId,
    campaignId: params.campaignId,
    memo: `Payment capture ${params.paymentPublicId}`,
    metadata: {
      providerKey: params.providerKey,
      providerRef: params.providerRef,
      paymentPublicId: params.paymentPublicId,
    },
  });

  let fundingTransactionId: string | null = null;
  let escrowSnapshotPublicId: string | null = null;

  if (params.campaignId) {
    const funding = await postLedgerTransaction({
      type: "campaign_funding",
      amountMinor: params.amountMinor,
      feeMinor: 0,
      netMinor: params.amountMinor,
      currency: params.currency,
      idempotencyKey: `campaign_funding:${params.idempotencyKey}`,
      organizationId: params.organizationId,
      campaignId: params.campaignId,
      memo: `Campaign funding ${params.paymentPublicId}`,
    });
    fundingTransactionId = funding.transactionId;

    // Move into escrow liability pool for the campaign
    await postLedgerTransaction({
      type: "escrow_reserve",
      amountMinor: params.amountMinor,
      feeMinor: 0,
      netMinor: params.amountMinor,
      currency: params.currency,
      idempotencyKey: `escrow_reserve:funding:${params.idempotencyKey}`,
      organizationId: params.organizationId,
      campaignId: params.campaignId,
      memo: `Escrow allocation from funding ${params.paymentPublicId}`,
    });

    const snapshot = await ensureEscrowSnapshotForCampaign({
      campaignId: params.campaignId,
    });
    escrowSnapshotPublicId = snapshot.publicId;

    await prisma.campaign.update({
      where: { id: params.campaignId },
      data: {
        reservedBudgetMinor: { increment: params.amountMinor },
      },
    });
  }

  return {
    captureTransactionId: capture.transactionId,
    fundingTransactionId,
    escrowSnapshotPublicId,
  };
}
