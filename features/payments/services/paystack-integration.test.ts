/**
 * Phase 3B.1 — payment domain edge cases around webhooks / refunds / reconcile.
 */

import { describe, expect, it } from "vitest";
import { getJournalTemplate } from "@/constants/journal-templates";
import {
  assertBalancedJournal,
  expandTemplateLines,
} from "@/features/ledger/services/integrity";
import {
  mapPaystackEventType,
  normalizePaystackWebhook,
} from "@/lib/integrations/payments/paystack/normalize";

describe("refund ledger template", () => {
  it("balances refund and escrow_refund journals", () => {
    for (const type of ["refund", "escrow_refund"] as const) {
      const template = getJournalTemplate(type);
      expect(template).toBeDefined();
      const lines = expandTemplateLines({
        lines: template!.lines,
        amountMinor: 2500,
        feeMinor: 0,
        netMinor: 2500,
      });
      expect(() => assertBalancedJournal(lines)).not.toThrow();
    }
  });
});

describe("callback-before-webhook semantics", () => {
  it("charge.success normalization is idempotent by provider event id", () => {
    const raw = {
      event: "charge.success",
      data: {
        id: 4242,
        reference: "zlnz_cb_1",
        amount: 1000,
        currency: "NGN",
        paid_at: "2026-07-26T12:00:00.000Z",
        metadata: { paymentPublicId: "PAY-CB0001" },
      },
    };
    const a = normalizePaystackWebhook(raw);
    const b = normalizePaystackWebhook(raw);
    expect(a?.idempotencyKey).toBe(b?.idempotencyKey);
    expect(a?.type).toBe("payment.succeeded");
  });
});

describe("reconciliation event coverage", () => {
  it("covers required Paystack event set", () => {
    const required = [
      "charge.success",
      "transfer.success",
      "transfer.failed",
      "refund.processed",
      "subscription.create",
      "subscription.disable",
      "invoice.create",
      "invoice.payment_failed",
    ];
    for (const event of required) {
      expect(mapPaystackEventType(event)).not.toBeNull();
    }
  });
});
