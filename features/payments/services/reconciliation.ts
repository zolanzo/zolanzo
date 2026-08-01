/**
 * Paystack ↔ internal ledger reconciliation.
 * Compares provider transactions to PaymentRecords / PaymentIntents.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { getPaymentAdapter } from "@/lib/integrations/payments";
import { isPaystackLiveMode } from "@/lib/integrations/payments/paystack/client";
import { logger } from "@/lib/observability/logger";

export type ReconciliationMismatch = {
  kind: "missing_internal" | "missing_provider" | "amount_mismatch" | "duplicate_internal";
  reference: string;
  detail: string;
  amountMinor?: number;
  currency?: string;
};

export type PaymentReconciliationReport = {
  providerKey: "paystack";
  mode: "live" | "stub" | "skipped";
  windowStart: string;
  windowEnd: string;
  providerCount: number;
  internalCount: number;
  matched: number;
  mismatches: ReconciliationMismatch[];
  generatedAt: string;
};

export async function reconcilePaystackPayments(params?: {
  windowHours?: number;
}): Promise<PaymentReconciliationReport> {
  const hours = params?.windowHours ?? 24;
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - hours * 60 * 60 * 1000);

  const base: PaymentReconciliationReport = {
    providerKey: "paystack",
    mode: isPaystackLiveMode() ? "live" : "stub",
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    providerCount: 0,
    internalCount: 0,
    matched: 0,
    mismatches: [],
    generatedAt: new Date().toISOString(),
  };

  const adapter = getPaymentAdapter("paystack");
  if (!adapter) {
    return { ...base, mode: "skipped" };
  }

  const internal = await prisma.paymentIntent.findMany({
    where: {
      providerKey: "paystack",
      createdAt: { gte: windowStart, lte: windowEnd },
      status: { in: ["succeeded", "awaiting_payment", "failed"] },
    },
    include: {
      records: true,
    },
    take: 500,
  });

  base.internalCount = internal.length;

  // Detect duplicate verified records for same provider ref
  const refCounts = new Map<string, number>();
  for (const intent of internal) {
    for (const rec of intent.records) {
      const key = rec.providerTransactionId;
      refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
    }
  }
  for (const [reference, count] of refCounts) {
    if (count > 1) {
      base.mismatches.push({
        kind: "duplicate_internal",
        reference,
        detail: `Duplicate payment records: ${count}`,
      });
    }
  }

  if (!isPaystackLiveMode() || !adapter.listTransactions) {
    // Offline mode: reconcile internal consistency only (succeeded without record).
    for (const intent of internal) {
      if (intent.status === "succeeded" && intent.records.length === 0) {
        base.mismatches.push({
          kind: "missing_internal",
          reference: intent.providerRef ?? intent.reference,
          detail: `Succeeded intent ${intent.publicId} has no payment record`,
          amountMinor: intent.amountMinor,
          currency: intent.currency,
        });
      } else if (intent.status === "succeeded") {
        base.matched += 1;
      }
    }

    await persistReport(base);
    return base;
  }

  const providerRows = await adapter.listTransactions({
    fromIso: windowStart.toISOString(),
    toIso: windowEnd.toISOString(),
    page: 1,
  });
  base.providerCount = providerRows.length;

  const byRef = new Map(
    internal
      .filter((i) => i.providerRef)
      .map((i) => [i.providerRef!, i] as const),
  );

  for (const row of providerRows) {
    const reference = String(row.reference ?? "");
    const amountMinor = Number(row.amount ?? 0);
    const currency = String(row.currency ?? "NGN").toUpperCase();
    const status = String(row.status ?? "").toLowerCase();
    if (!reference) continue;
    if (status !== "success") continue;

    const intent = byRef.get(reference);
    if (!intent) {
      base.mismatches.push({
        kind: "missing_internal",
        reference,
        detail: "Provider success has no matching PaymentIntent",
        amountMinor,
        currency,
      });
      continue;
    }

    if (intent.amountMinor !== amountMinor) {
      base.mismatches.push({
        kind: "amount_mismatch",
        reference,
        detail: `Internal ${intent.amountMinor} vs provider ${amountMinor}`,
        amountMinor,
        currency,
      });
      continue;
    }

    base.matched += 1;
    byRef.delete(reference);
  }

  for (const [, intent] of byRef) {
    if (intent.status === "succeeded") {
      base.mismatches.push({
        kind: "missing_provider",
        reference: intent.providerRef ?? intent.reference,
        detail: `Internal succeeded ${intent.publicId} not found at provider`,
        amountMinor: intent.amountMinor,
        currency: intent.currency,
      });
    }
  }

  await persistReport(base);
  logger.info("Paystack reconciliation complete", {
    span: "payment.reconcile",
    matched: base.matched,
    mismatches: base.mismatches.length,
    providerCount: base.providerCount,
    internalCount: base.internalCount,
  });

  return base;
}

async function persistReport(report: PaymentReconciliationReport): Promise<void> {
  await prisma.dashboardSnapshot.upsert({
    where: { key: "payment_reconciliation:paystack:latest" },
    create: {
      key: "payment_reconciliation:paystack:latest",
      payload: report,
      generatedAt: new Date(report.generatedAt),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    update: {
      payload: report,
      generatedAt: new Date(report.generatedAt),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getLatestPaystackReconciliation(): Promise<PaymentReconciliationReport | null> {
  const row = await prisma.dashboardSnapshot.findUnique({
    where: { key: "payment_reconciliation:paystack:latest" },
  });
  if (!row?.payload || typeof row.payload !== "object") return null;
  return row.payload as PaymentReconciliationReport;
}
