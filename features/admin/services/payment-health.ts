/**
 * Admin Payment Health — Command Center signals for Paystack ops.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { paystackAdapterMode } from "@/lib/integrations/payments/paystack-adapter";
import { isPaystackConfigured } from "@/lib/integrations/payments/paystack/client";
import { getLatestPaystackReconciliation } from "@/features/payments/services/reconciliation";
import { getMetricsSnapshot } from "@/lib/observability/metrics";

export type PaymentHealthSnapshot = {
  providerMode: "live" | "stub";
  keysConfigured: boolean;
  pendingCallbacks: number;
  awaitingPayment: number;
  failedWebhooksApprox: number;
  recentPayments: Array<{
    publicId: string;
    status: string;
    amountMinor: number;
    currency: string;
    purpose: string;
    createdAt: string;
  }>;
  failedPayments: Array<{
    publicId: string;
    status: string;
    amountMinor: number;
    currency: string;
    updatedAt: string;
  }>;
  reconciliation: {
    status: "clean" | "mismatches" | "unknown";
    matched: number;
    mismatchCount: number;
    generatedAt: string | null;
  };
  webhookMetrics: {
    received: number;
    verified: number;
    rejected: number;
    replayBlocked: number;
  };
  generatedAt: string;
};

export async function getPaymentHealthSnapshot(): Promise<PaymentHealthSnapshot> {
  const [awaitingPayment, pendingCallbacks, recent, failed, reconciliation] =
    await Promise.all([
      prisma.paymentIntent.count({
        where: { status: { in: ["awaiting_payment", "pending_provider"] } },
      }),
      prisma.paymentIntent.count({
        where: {
          status: "awaiting_payment",
          updatedAt: { lte: new Date(Date.now() - 15 * 60 * 1000) },
        },
      }),
      prisma.paymentIntent.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          publicId: true,
          status: true,
          amountMinor: true,
          currency: true,
          purpose: true,
          createdAt: true,
        },
      }),
      prisma.paymentIntent.findMany({
        where: { status: "failed" },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          publicId: true,
          status: true,
          amountMinor: true,
          currency: true,
          updatedAt: true,
        },
      }),
      getLatestPaystackReconciliation(),
    ]);

  const snap = getMetricsSnapshot();
  const mismatchCount = reconciliation?.mismatches.length ?? 0;

  return {
    providerMode: paystackAdapterMode(),
    keysConfigured: isPaystackConfigured(),
    pendingCallbacks,
    awaitingPayment,
    failedWebhooksApprox: snap.derived.webhookRejected,
    recentPayments: recent.map((p) => ({
      publicId: p.publicId,
      status: p.status,
      amountMinor: p.amountMinor,
      currency: p.currency,
      purpose: p.purpose,
      createdAt: p.createdAt.toISOString(),
    })),
    failedPayments: failed.map((p) => ({
      publicId: p.publicId,
      status: p.status,
      amountMinor: p.amountMinor,
      currency: p.currency,
      updatedAt: p.updatedAt.toISOString(),
    })),
    reconciliation: {
      status: reconciliation
        ? mismatchCount === 0
          ? "clean"
          : "mismatches"
        : "unknown",
      matched: reconciliation?.matched ?? 0,
      mismatchCount,
      generatedAt: reconciliation?.generatedAt ?? null,
    },
    webhookMetrics: {
      received: snap.derived.webhookReceived,
      verified: snap.derived.webhookVerified,
      rejected: snap.derived.webhookRejected,
      replayBlocked: snap.derived.webhookReplayBlocked,
    },
    generatedAt: new Date().toISOString(),
  };
}
