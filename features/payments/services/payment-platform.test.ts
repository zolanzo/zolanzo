import { describe, expect, it } from "vitest";
import {
  listPaymentAdapters,
  selectPaymentAdapter,
  paystackPaymentAdapter,
  memoryPaymentAdapter,
} from "@/lib/integrations/payments";
import { adapterHasCapabilities } from "@/lib/integrations/payments/stub-factory";
import { formatRandomPublicId, isValidPublicId } from "@/lib/public-id/format";
import { getJournalTemplate } from "@/constants/journal-templates";
import {
  assertBalancedJournal,
  expandTemplateLines,
} from "@/features/ledger/services/integrity";

describe("payment adapter contracts", () => {
  it("lists builtin adapters including stubs", () => {
    const keys = listPaymentAdapters().map((a) => a.providerKey);
    expect(keys).toContain("paystack");
    expect(keys).toContain("flutterwave");
    expect(keys).toContain("stripe");
    expect(keys).toContain("monnify");
    expect(keys).toContain("memory");
  });

  it("selects by capabilities without naming a provider", () => {
    const adapter = selectPaymentAdapter({
      requiredCapabilities: ["accepts_payments", "webhooks"],
    });
    expect(adapter.capabilities).toContain("accepts_payments");
  });

  it("selects paystack when virtual accounts required", () => {
    const adapter = selectPaymentAdapter({
      requiredCapabilities: ["accepts_payments", "virtual_accounts"],
    });
    expect(["paystack", "monnify"]).toContain(adapter.providerKey);
  });

  it("creates stub checkout sessions without live API", async () => {
    const result = await paystackPaymentAdapter.createPaymentIntent({
      amountMinor: 10_000,
      currency: "NGN",
      customerRef: "user_1",
      idempotencyKey: "idem_test_1",
      paymentPublicId: "PAY-6N2K8M",
    });
    expect(result.provider).toBe("paystack");
    expect(result.status).toBe("initiated");
    expect(result.checkoutUrl).toContain("paystack");
  });
});

describe("webhook normalization", () => {
  it("parses stub webhook payloads", async () => {
    const body = JSON.stringify({
      stub: true,
      type: "payment.succeeded",
      providerRef: "mem_ref_1",
      amountMinor: 5000,
      currency: "NGN",
      paymentPublicId: "PAY-6N2K8M",
    });
    const parsed = await memoryPaymentAdapter.parseWebhook(
      { "x-payment-signature": "stub" },
      body,
    );
    expect(parsed.validSignature).toBe(true);
    expect(parsed.events[0]?.type).toBe("payment.succeeded");
    expect(parsed.events[0]?.idempotencyKey).toContain("payment.succeeded");
  });

  it("rejects missing signature when body is not stub", async () => {
    const parsed = await memoryPaymentAdapter.parseWebhook(
      {},
      JSON.stringify({ type: "payment.succeeded", providerRef: "x" }),
    );
    expect(parsed.validSignature).toBe(false);
  });
});

describe("provider capabilities", () => {
  it("reports capability membership", () => {
    expect(
      adapterHasCapabilities(paystackPaymentAdapter, [
        "accepts_payments",
        "virtual_accounts",
      ]),
    ).toBe(true);
    expect(
      adapterHasCapabilities(memoryPaymentAdapter, ["virtual_accounts"]),
    ).toBe(false);
  });
});

describe("funding ledger templates", () => {
  it("balances payment_capture and campaign_funding", () => {
    for (const type of ["payment_capture", "campaign_funding", "escrow_reserve"] as const) {
      const template = getJournalTemplate(type);
      expect(template).toBeDefined();
      const lines = expandTemplateLines({
        lines: template!.lines,
        amountMinor: 1000,
        feeMinor: 0,
        netMinor: 1000,
      });
      assertBalancedJournal(lines);
    }
  });
});

describe("payment public ids", () => {
  it("formats PAY random ids", () => {
    const id = formatRandomPublicId("payment", "6N2K8M");
    expect(id).toBe("PAY-6N2K8M");
    expect(isValidPublicId("payment", id)).toBe(true);
  });
});
