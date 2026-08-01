/**
 * Phase 3B.1 — Paystack adapter unit tests (no live network).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  paystackPaymentAdapter,
  selectPaymentAdapter,
} from "@/lib/integrations/payments";
import {
  computePaystackSignature,
  verifyPaystackWebhook,
} from "@/lib/integrations/payments/paystack/signature";
import {
  mapPaystackEventType,
  normalizePaystackWebhook,
} from "@/lib/integrations/payments/paystack/normalize";
import { clearWebhookReplayCache } from "@/lib/security/webhook-auth";
import { AppError } from "@/lib/api/response";

const SECRET = "sk_test_paystack_secret_for_unit_tests_only";

function signedHeaders(body: string, secret = SECRET) {
  return {
    "x-paystack-signature": computePaystackSignature(body, secret),
  };
}

describe("paystack normalize", () => {
  it("maps charge.success to payment.succeeded", () => {
    expect(mapPaystackEventType("charge.success")).toBe("payment.succeeded");
    expect(mapPaystackEventType("refund.processed")).toBe("payment.refunded");
    expect(mapPaystackEventType("transfer.success")).toBe("transfer.succeeded");
    expect(mapPaystackEventType("mystery.event")).toBeNull();
  });

  it("normalizes charge.success with metadata paymentPublicId", () => {
    const event = normalizePaystackWebhook({
      event: "charge.success",
      data: {
        id: 991,
        reference: "zlnz_pay_abc",
        amount: 50000,
        currency: "NGN",
        paid_at: new Date().toISOString(),
        metadata: { paymentPublicId: "PAY-6N2K8M" },
      },
    });
    expect(event?.type).toBe("payment.succeeded");
    expect(event?.paymentPublicId).toBe("PAY-6N2K8M");
    expect(event?.amountMinor).toBe(50000);
    expect(event?.idempotencyKey).toContain("charge.success");
  });
});

describe("paystack signature + replay", () => {
  afterEach(() => {
    clearWebhookReplayCache();
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  it("accepts valid HMAC-SHA512 signature", () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const body = JSON.stringify({
      event: "charge.success",
      data: { id: 1, reference: "ref_ok", amount: 100, currency: "NGN" },
    });
    const result = verifyPaystackWebhook({
      headers: signedHeaders(body),
      body,
      eventId: "paystack:charge.success:1",
      occurredAtIso: new Date().toISOString(),
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects invalid signature", () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const body = JSON.stringify({ event: "charge.success", data: { id: 2 } });
    const result = verifyPaystackWebhook({
      headers: { "x-paystack-signature": "deadbeef" },
      body,
      eventId: "paystack:charge.success:2",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_signature");
  });

  it("blocks replayed event ids", () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const body = JSON.stringify({
      event: "charge.success",
      data: { id: 3, reference: "ref_replay" },
    });
    const headers = signedHeaders(body);
    const first = verifyPaystackWebhook({
      headers,
      body,
      eventId: "paystack:charge.success:3",
    });
    expect(first.ok).toBe(true);
    expect(() =>
      verifyPaystackWebhook({
        headers,
        body,
        eventId: "paystack:charge.success:3",
      }),
    ).toThrow(AppError);
  });
});

describe("paystack parseWebhook", () => {
  afterEach(() => {
    clearWebhookReplayCache();
    delete process.env.PAYSTACK_SECRET_KEY;
    vi.unstubAllGlobals();
  });

  it("parses successful charge webhook in live mode", async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const body = JSON.stringify({
      event: "charge.success",
      data: {
        id: 44,
        reference: "zlnz_success_1",
        amount: 2500,
        currency: "NGN",
        paid_at: new Date().toISOString(),
        metadata: { paymentPublicId: "PAY-TEST01" },
      },
    });
    const parsed = await paystackPaymentAdapter.parseWebhook(
      signedHeaders(body),
      body,
    );
    expect(parsed.validSignature).toBe(true);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0]?.type).toBe("payment.succeeded");
  });

  it("ignores unknown events after valid signature (log only)", async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const body = JSON.stringify({
      event: "customeridentification.failed",
      data: { id: 55, reference: "x" },
    });
    const parsed = await paystackPaymentAdapter.parseWebhook(
      signedHeaders(body),
      body,
    );
    expect(parsed.validSignature).toBe(true);
    expect(parsed.events).toHaveLength(0);
  });

  it("rejects bad signature in live mode", async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const body = JSON.stringify({
      event: "charge.success",
      data: { id: 66, reference: "bad_sig", amount: 1, currency: "NGN" },
    });
    const parsed = await paystackPaymentAdapter.parseWebhook(
      { "x-paystack-signature": "00".repeat(32) },
      body,
    );
    expect(parsed.validSignature).toBe(false);
  });
});

describe("paystack verify + init (mocked fetch)", () => {
  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
    vi.unstubAllGlobals();
  });

  it("verifies amount and currency on success", async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          message: "Verification successful",
          data: {
            id: 1,
            status: "success",
            reference: "ref_v1",
            amount: 10_000,
            currency: "NGN",
            paid_at: new Date().toISOString(),
          },
        }),
      })),
    );

    const result = await paystackPaymentAdapter.verifyPayment({
      providerRef: "ref_v1",
      amountMinor: 10_000,
      currency: "NGN",
    });
    expect(result.verified).toBe(true);
    expect(result.status).toBe("succeeded");
  });

  it("fails verification when amount mismatches", async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          data: {
            id: 2,
            status: "success",
            reference: "ref_v2",
            amount: 999,
            currency: "NGN",
          },
        }),
      })),
    );

    const result = await paystackPaymentAdapter.verifyPayment({
      providerRef: "ref_v2",
      amountMinor: 10_000,
      currency: "NGN",
    });
    expect(result.verified).toBe(false);
  });

  it("initializes checkout session via Paystack API", async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          data: {
            authorization_url: "https://checkout.paystack.com/abc",
            access_code: "access_abc",
            reference: "zlnz_pay_ref",
          },
        }),
      })),
    );

    const result = await paystackPaymentAdapter.createPaymentIntent({
      amountMinor: 5000,
      currency: "NGN",
      customerRef: "user_1",
      idempotencyKey: "idem_live_1",
      paymentPublicId: "PAY-LIVE01",
      returnUrl: "https://app.example/api/payments/callback",
    });
    expect(result.checkoutUrl).toContain("paystack.com");
    expect(result.providerRef).toBe("zlnz_pay_ref");
  });

  it("refunds via Paystack API when live", async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          data: { id: 777, amount: 1000, currency: "NGN", status: "processed" },
        }),
      })),
    );

    const result = await paystackPaymentAdapter.refundPayment!({
      providerRef: "ref_refund",
      amountMinor: 1000,
    });
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.providerRefundRef).toBe("777");
    }
  });
});

describe("paystack selection", () => {
  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  it("prefers paystack when live keys are present", () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    const adapter = selectPaymentAdapter({
      requiredCapabilities: ["accepts_payments", "webhooks"],
    });
    expect(adapter.providerKey).toBe("paystack");
  });

  it("falls back when keys absent", () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const adapter = selectPaymentAdapter({
      requiredCapabilities: ["accepts_payments", "webhooks"],
    });
    expect(adapter.providerKey).toBeTruthy();
  });
});
