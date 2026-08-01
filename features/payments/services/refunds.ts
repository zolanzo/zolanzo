/**
 * Payment refund + callback helpers (domain).
 * Ledger mutations only from verified webhook / ops refund paths.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { selectPaymentAdapter } from "@/lib/integrations/payments";
import { postLedgerTransaction } from "@/features/ledger/services/posting";
import { z } from "zod";
import { logger } from "@/lib/observability/logger";

export async function applyPaymentRefundLedger(params: {
  paymentIntentId: string;
  paymentPublicId: string;
  amountMinor: number;
  currency: string;
  organizationId: string;
  campaignId: string | null;
  providerKey: string;
  providerRef: string;
  idempotencyKey: string;
}): Promise<{ refundTransactionId: string }> {
  // If campaign funding reserved escrow, reverse escrow first then refund capture.
  if (params.campaignId) {
    await postLedgerTransaction({
      type: "escrow_refund",
      amountMinor: params.amountMinor,
      feeMinor: 0,
      netMinor: params.amountMinor,
      currency: params.currency,
      idempotencyKey: `escrow_refund:payment:${params.idempotencyKey}`,
      organizationId: params.organizationId,
      campaignId: params.campaignId,
      memo: `Escrow reverse for refund ${params.paymentPublicId}`,
    });

    await prisma.campaign.update({
      where: { id: params.campaignId },
      data: {
        reservedBudgetMinor: { decrement: params.amountMinor },
      },
    });
  }

  const refund = await postLedgerTransaction({
    type: "refund",
    amountMinor: params.amountMinor,
    feeMinor: 0,
    netMinor: params.amountMinor,
    currency: params.currency,
    idempotencyKey: `refund:${params.idempotencyKey}`,
    organizationId: params.organizationId,
    campaignId: params.campaignId,
    memo: `Payment refund ${params.paymentPublicId}`,
    metadata: {
      providerKey: params.providerKey,
      providerRef: params.providerRef,
      paymentPublicId: params.paymentPublicId,
    },
  });

  return { refundTransactionId: refund.transactionId };
}

export const requestRefundSchema = z.object({
  paymentPublicId: z.string().min(1),
  amountMinor: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

/**
 * Initiate a provider refund. Ledger reversal happens on refund.processed webhook
 * (or immediately when provider confirms accepted for sync stubs).
 */
export async function requestPaymentRefund(params: {
  input: unknown;
  actorUserId: string;
}): Promise<
  ApiResponse<{
    paymentPublicId: string;
    accepted: boolean;
    providerRefundRef: string | null;
    reason?: string;
  }>
> {
  try {
    const parsed = requestRefundSchema.parse(params.input);
    const intent = await prisma.paymentIntent.findUnique({
      where: { publicId: parsed.paymentPublicId },
      include: { records: { where: { status: "verified" }, take: 1 } },
    });
    if (!intent) {
      throw new AppError("NOT_FOUND", "Payment intent not found", 404);
    }
    if (intent.status !== "succeeded") {
      throw new AppError(
        "NOT_REFUNDABLE",
        "Only succeeded payments can be refunded",
        400,
      );
    }
    if (!intent.providerKey || !intent.providerRef) {
      throw new AppError("NO_PROVIDER", "Provider session missing", 400);
    }

    const amountMinor = parsed.amountMinor ?? intent.amountMinor;
    if (amountMinor > intent.amountMinor) {
      throw new AppError(
        "REFUND_TOO_LARGE",
        "Refund exceeds original amount",
        400,
      );
    }

    const adapter = selectPaymentAdapter({ providerKey: intent.providerKey as "paystack" });
    if (!adapter.refundPayment) {
      throw new AppError("REFUND_UNSUPPORTED", "Provider cannot refund", 400);
    }

    const result = await adapter.refundPayment({
      providerRef: intent.providerRef,
      amountMinor,
      reason: parsed.reason,
    });

    await prisma.paymentEvent.create({
      data: {
        paymentIntentId: intent.id,
        type: "payment.refunded",
        providerKey: intent.providerKey,
        providerRef: intent.providerRef,
        idempotencyKey: `${intent.providerKey}:${intent.providerRef}:refund_request:${amountMinor}:${params.actorUserId}:${Date.now()}`,
        amountMinor,
        currency: intent.currency,
        payload: {
          source: "refund_request",
          actorUserId: params.actorUserId,
          accepted: result.accepted,
          reason: "reason" in result ? result.reason : null,
          providerRefundRef:
            result.accepted === true ? result.providerRefundRef : null,
        } as Prisma.InputJsonValue,
        occurredAt: new Date(),
        processed: false,
      },
    });

    logger.info("Payment refund requested", {
      span: "payment.refund",
      paymentPublicId: intent.publicId,
      accepted: result.accepted,
      actorUserId: params.actorUserId,
    });

    if (!result.accepted) {
      return apiSuccess({
        paymentPublicId: intent.publicId,
        accepted: false,
        providerRefundRef: null,
        reason: result.reason,
      });
    }

    return apiSuccess({
      paymentPublicId: intent.publicId,
      accepted: true,
      providerRefundRef: result.providerRefundRef,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "REFUND_FAILED",
      error instanceof Error ? error.message : "Refund failed",
    );
  }
}

/**
 * Callback validation only — never posts ledger.
 */
export async function validatePaymentCallback(params: {
  reference: string;
}): Promise<{
  paymentPublicId: string | null;
  status: string;
  verified: boolean;
  amountMatches: boolean;
  currencyMatches: boolean;
  message: string;
}> {
  const intent =
    (await prisma.paymentIntent.findFirst({
      where: { providerRef: params.reference },
    })) ??
    (await prisma.paymentIntent.findFirst({
      where: { reference: params.reference },
    }));

  if (!intent || !intent.providerKey || !intent.providerRef) {
    return {
      paymentPublicId: null,
      status: "unknown",
      verified: false,
      amountMatches: false,
      currencyMatches: false,
      message: "Payment reference not found",
    };
  }

  const adapter = selectPaymentAdapter({
    providerKey: intent.providerKey as "paystack",
  });
  const verification = await adapter.verifyPayment({
    providerRef: intent.providerRef,
    amountMinor: intent.amountMinor,
    currency: intent.currency,
  });

  return {
    paymentPublicId: intent.publicId,
    status: verification.status,
    verified: verification.verified,
    amountMatches:
      verification.amountMinor === intent.amountMinor ||
      intent.amountMinor === 0,
    currencyMatches:
      verification.currency.toUpperCase() === intent.currency.toUpperCase(),
    message:
      "Callback validated. Ledger updates occur only via verified webhooks.",
  };
}
