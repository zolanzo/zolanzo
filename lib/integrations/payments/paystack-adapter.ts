/**
 * Paystack payment adapter — production-grade.
 * Uses live Paystack HTTP API when PAYSTACK_SECRET_KEY is set.
 * Without keys, falls back to stub behavior (tests / pre-credential envs).
 * Domain code must import via PaymentProviderAdapter ports only.
 */

import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProviderAdapter,
  PaymentVerificationInput,
  PaymentVerificationResult,
  PaymentWebhookParseResult,
} from "@/lib/integrations/types";
import { AppError } from "@/lib/api/response";
import { createStubAdapter } from "@/lib/integrations/payments/stub-factory";
import {
  isPaystackLiveMode,
  paystackRequest,
  type PaystackInitializeData,
  type PaystackRefundData,
  type PaystackTransactionListItem,
  type PaystackVerifyData,
} from "@/lib/integrations/payments/paystack/client";
import { verifyPaystackWebhook } from "@/lib/integrations/payments/paystack/signature";
import {
  extractPaystackEventId,
  extractPaystackOccurredAt,
  isSupportedPaystackEvent,
  mapPaystackEventType,
  normalizePaystackWebhook,
} from "@/lib/integrations/payments/paystack/normalize";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";

const CAPABILITIES = [
  "accepts_payments",
  "bank_transfers",
  "refunds",
  "recurring_billing",
  "webhooks",
  "multi_currency",
  "payouts",
  "virtual_accounts",
] as const;

const stub = createStubAdapter({
  providerKey: "paystack",
  capabilities: CAPABILITIES,
});

function customerEmail(customerRef: string, metadata?: Record<string, string>) {
  if (metadata?.email && metadata.email.includes("@")) return metadata.email;
  // Paystack requires an email; use a stable synthetic address for refs.
  const safe = customerRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "user";
  return `${safe}@payments.zolanzo.local`;
}

async function createLiveIntent(
  input: PaymentIntentInput,
): Promise<PaymentIntentResult> {
  const reference =
    input.paymentPublicId?.replace(/-/g, "_").toLowerCase() ??
    input.idempotencyKey.slice(0, 40);

  const result = await paystackRequest<PaystackInitializeData>({
    method: "POST",
    path: "/transaction/initialize",
    body: {
      amount: input.amountMinor,
      currency: input.currency.toUpperCase(),
      email: customerEmail(input.customerRef, input.metadata),
      reference: `zlnz_${reference}`,
      callback_url: input.returnUrl,
      metadata: {
        ...input.metadata,
        paymentPublicId: input.paymentPublicId ?? "",
        purpose: input.purpose ?? "",
        idempotencyKey: input.idempotencyKey,
        custom_fields: [
          {
            display_name: "Payment ID",
            variable_name: "payment_public_id",
            value: input.paymentPublicId ?? "",
          },
        ],
      },
    },
  });

  if (!result.ok) {
    throw new AppError(
      "PAYSTACK_INIT_FAILED",
      result.message || "Paystack initialize failed",
      502,
    );
  }

  return {
    provider: "paystack",
    providerRef: result.data.reference,
    status: "initiated",
    checkoutUrl: result.data.authorization_url,
    raw: {
      live: true,
      accessCode: result.data.access_code,
      reference: result.data.reference,
    },
  };
}

async function verifyLive(
  input: PaymentVerificationInput,
): Promise<PaymentVerificationResult> {
  const result = await paystackRequest<PaystackVerifyData>({
    method: "GET",
    path: `/transaction/verify/${encodeURIComponent(input.providerRef)}`,
  });

  if (!result.ok) {
    return {
      provider: "paystack",
      providerRef: input.providerRef,
      verified: false,
      status: "failed",
      amountMinor: input.amountMinor ?? 0,
      currency: (input.currency ?? "NGN").toUpperCase(),
      snapshot: { live: true, error: result.message },
    };
  }

  const data = result.data;
  const statusRaw = String(data.status ?? "").toLowerCase();
  const status: PaymentVerificationResult["status"] =
    statusRaw === "success"
      ? "succeeded"
      : statusRaw === "failed" || statusRaw === "abandoned"
        ? "failed"
        : "pending";

  const amountMinor = Number(data.amount ?? 0);
  const currency = String(data.currency ?? "NGN").toUpperCase();

  let verified = status === "succeeded";
  if (
    verified &&
    input.amountMinor != null &&
    input.amountMinor > 0 &&
    amountMinor !== input.amountMinor
  ) {
    verified = false;
  }
  if (
    verified &&
    input.currency &&
    currency !== input.currency.toUpperCase()
  ) {
    verified = false;
  }

  return {
    provider: "paystack",
    providerRef: data.reference || input.providerRef,
    verified,
    status: verified ? "succeeded" : status === "pending" ? "pending" : "failed",
    amountMinor,
    currency,
    snapshot: {
      live: true,
      paystackId: data.id,
      status: data.status,
      channel: data.channel ?? null,
      paidAt: data.paid_at ?? null,
      gatewayResponse: data.gateway_response ?? null,
      metadata: data.metadata ?? null,
    },
  };
}

export const paystackPaymentAdapter: PaymentProviderAdapter = {
  providerKey: "paystack",
  capabilities: CAPABILITIES,

  async createPaymentIntent(input) {
    if (!isPaystackLiveMode()) {
      return stub.createPaymentIntent(input);
    }
    return createLiveIntent(input);
  },

  async verifyPayment(input) {
    if (!isPaystackLiveMode()) {
      return stub.verifyPayment(input);
    }
    return verifyLive(input);
  },

  async parseWebhook(headers, body): Promise<PaymentWebhookParseResult> {
    metrics.webhook({ provider: "paystack", outcome: "received" });

    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(body) as Record<string, unknown>;
    } catch {
      metrics.webhook({ provider: "paystack", outcome: "rejected" });
      return { validSignature: false, events: [] };
    }

    const eventName = String(raw.event ?? "");
    const eventId = extractPaystackEventId(raw);
    const occurredAt = extractPaystackOccurredAt(raw);

    if (!isPaystackLiveMode()) {
      // Pre-live: allow stub HMAC path for local tests that still target paystack key.
      return stub.parseWebhook(headers, body);
    }

    try {
      const verified = verifyPaystackWebhook({
        headers,
        body,
        eventId,
        occurredAtIso: occurredAt,
      });
      if (!verified.ok) {
        metrics.webhook({ provider: "paystack", outcome: "rejected" });
        logger.warn("Paystack webhook rejected", {
          span: "paystack.webhook",
          reason: verified.reason,
          event: eventName,
        });
        return { validSignature: false, events: [] };
      }
    } catch (error) {
      if (error instanceof AppError && error.code === "WEBHOOK_REPLAY") {
        metrics.webhook({ provider: "paystack", outcome: "replay_blocked" });
        throw error;
      }
      metrics.webhook({ provider: "paystack", outcome: "rejected" });
      return { validSignature: false, events: [] };
    }

    metrics.webhook({ provider: "paystack", outcome: "verified" });

    if (!isSupportedPaystackEvent(eventName)) {
      logger.info("Paystack unknown event ignored", {
        span: "paystack.webhook",
        event: eventName,
        eventVersion: "paystack.v1",
      });
      return { validSignature: true, events: [] };
    }

    const mapped = mapPaystackEventType(eventName);
    if (!mapped || mapped === "log_only") {
      logger.info("Paystack event logged only", {
        span: "paystack.webhook",
        event: eventName,
      });
      return { validSignature: true, events: [] };
    }

    const event = normalizePaystackWebhook(raw);
    return {
      validSignature: true,
      events: event ? [event] : [],
    };
  },

  normalizeEvent(raw) {
    if (raw.event) {
      return normalizePaystackWebhook(raw);
    }
    return stub.normalizeEvent(raw);
  },

  async refundPayment(input) {
    if (!isPaystackLiveMode()) {
      return {
        accepted: false as const,
        reason: "Paystack live keys required for refunds",
      };
    }

    const result = await paystackRequest<PaystackRefundData>({
      method: "POST",
      path: "/refund",
      body: {
        transaction: input.providerRef,
        amount: input.amountMinor,
        merchant_note: input.reason ?? "Zolanzo refund",
      },
    });

    if (!result.ok) {
      return { accepted: false as const, reason: result.message };
    }

    return {
      accepted: true as const,
      providerRefundRef: String(result.data.id),
      raw: result.data as unknown as Record<string, unknown>,
    };
  },

  async createTransfer() {
    return {
      accepted: false as const,
      reason: "Paystack transfers are reserved for withdrawal rails (later slice)",
    };
  },

  async getTransaction(providerRef) {
    if (!isPaystackLiveMode()) {
      return stub.getTransaction?.(providerRef) ?? null;
    }
    const result = await paystackRequest<PaystackVerifyData>({
      method: "GET",
      path: `/transaction/verify/${encodeURIComponent(providerRef)}`,
    });
    if (!result.ok) return null;
    return result.data as unknown as Record<string, unknown>;
  },

  async listTransactions(input) {
    if (!isPaystackLiveMode()) return [];
    const from = input.fromIso.slice(0, 10);
    const to = input.toIso.slice(0, 10);
    const page = input.page ?? 1;
    const result = await paystackRequest<PaystackTransactionListItem[]>({
      method: "GET",
      path: `/transaction?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&perPage=100&page=${page}`,
    });
    if (!result.ok || !Array.isArray(result.data)) return [];
    return result.data.map((row) => row as unknown as Record<string, unknown>);
  },
};

export function paystackAdapterMode(): "live" | "stub" {
  return isPaystackLiveMode() ? "live" : "stub";
}
