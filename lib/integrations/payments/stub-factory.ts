/**
 * Shared helpers for payment adapter stubs (no live API calls).
 */

import type {
  NormalizedPaymentEvent,
  PaymentCapability,
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProviderAdapter,
  PaymentVerificationInput,
  PaymentVerificationResult,
  PaymentWebhookParseResult,
} from "@/lib/integrations/types";

export function stubRefund(): Promise<{ accepted: false; reason: string }> {
  return Promise.resolve({
    accepted: false,
    reason: "Refund execution deferred — adapter stub only",
  });
}

export function stubTransfer(): Promise<{ accepted: false; reason: string }> {
  return Promise.resolve({
    accepted: false,
    reason: "Transfer execution deferred — adapter stub only",
  });
}

export function createStubAdapter(params: {
  providerKey: string;
  capabilities: readonly PaymentCapability[];
}): PaymentProviderAdapter {
  const { providerKey, capabilities } = params;

  return {
    providerKey,
    capabilities,

    async createPaymentIntent(
      input: PaymentIntentInput,
    ): Promise<PaymentIntentResult> {
      const providerRef = `${providerKey}_stub_${input.idempotencyKey.slice(0, 24)}`;
      return {
        provider: providerKey,
        providerRef,
        status: "initiated",
        checkoutUrl: `https://stub.payments.local/${providerKey}/checkout/${providerRef}`,
        raw: {
          stub: true,
          amountMinor: input.amountMinor,
          currency: input.currency,
          paymentPublicId: input.paymentPublicId ?? null,
        },
      };
    },

    async verifyPayment(
      input: PaymentVerificationInput,
    ): Promise<PaymentVerificationResult> {
      return {
        provider: providerKey,
        providerRef: input.providerRef,
        verified: true,
        status: "succeeded",
        amountMinor: input.amountMinor ?? 0,
        currency: input.currency ?? "NGN",
        snapshot: {
          stub: true,
          verifiedAt: new Date().toISOString(),
          providerRef: input.providerRef,
        },
      };
    },

    async parseWebhook(
      headers: Record<string, string>,
      body: string,
    ): Promise<PaymentWebhookParseResult> {
      let raw: Record<string, unknown> = {};
      try {
        raw = JSON.parse(body) as Record<string, unknown>;
      } catch {
        return { validSignature: false, events: [] };
      }

      // Stub: accept when header present or body marks stub
      const sig =
        headers["x-payment-signature"] ??
        headers["x-paystack-signature"] ??
        headers["stripe-signature"] ??
        headers["verif-hash"];
      const validSignature = Boolean(sig) || raw.stub === true;

      const event = normalizeStubEvent(providerKey, raw);
      return {
        validSignature,
        events: event ? [event] : [],
      };
    },

    normalizeEvent(raw: Record<string, unknown>): NormalizedPaymentEvent | null {
      return normalizeStubEvent(providerKey, raw);
    },

    refundPayment: stubRefund,
    createTransfer: stubTransfer,

    async getTransaction(providerRef: string) {
      return { stub: true, provider: providerKey, providerRef };
    },
  };
}

function normalizeStubEvent(
  provider: string,
  raw: Record<string, unknown>,
): NormalizedPaymentEvent | null {
  const typeRaw = String(raw.type ?? raw.event ?? "payment.succeeded");
  const typeMap: Record<string, NormalizedPaymentEvent["type"]> = {
    "payment.initiated": "payment.initiated",
    "payment.succeeded": "payment.succeeded",
    "payment.failed": "payment.failed",
    "payment.refunded": "payment.refunded",
    "payment.chargeback": "payment.chargeback",
    charge: "payment.succeeded",
    "charge.success": "payment.succeeded",
    "charge.failed": "payment.failed",
    "checkout.session.completed": "payment.succeeded",
  };
  const type = typeMap[typeRaw] ?? "payment.succeeded";
  const providerRef = String(
    raw.providerRef ?? raw.reference ?? raw.id ?? `unknown_${Date.now()}`,
  );
  const amountMinor = Number(raw.amountMinor ?? raw.amount ?? 0);
  const currency = String(raw.currency ?? "NGN").toUpperCase();
  const paymentPublicId =
    typeof raw.paymentPublicId === "string" ? raw.paymentPublicId : null;

  return {
    type,
    provider,
    providerRef,
    paymentPublicId,
    amountMinor,
    currency,
    occurredAt:
      typeof raw.occurredAt === "string"
        ? raw.occurredAt
        : new Date().toISOString(),
    idempotencyKey: `${provider}:${providerRef}:${type}`,
    raw,
  };
}

export function adapterHasCapabilities(
  adapter: PaymentProviderAdapter,
  required: readonly PaymentCapability[],
): boolean {
  const set = new Set(adapter.capabilities);
  return required.every((c) => set.has(c));
}
