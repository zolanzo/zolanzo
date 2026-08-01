/**
 * Normalize Paystack webhook payloads → NormalizedPaymentEvent.
 * Unknown events return null (caller logs only).
 */

import type { NormalizedPaymentEvent } from "@/lib/integrations/types";

export type PaystackWebhookEnvelope = {
  event?: string;
  data?: Record<string, unknown>;
};

const SUPPORTED_EVENTS = new Set([
  "charge.success",
  "transfer.success",
  "transfer.failed",
  "refund.processed",
  "subscription.create",
  "subscription.disable",
  "invoice.create",
  "invoice.payment_failed",
]);

export function isSupportedPaystackEvent(event: string): boolean {
  return SUPPORTED_EVENTS.has(event);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function metadataPublicId(data: Record<string, unknown>): string | null {
  const meta = asRecord(data.metadata);
  const fromMeta =
    typeof meta.paymentPublicId === "string"
      ? meta.paymentPublicId
      : typeof meta.payment_public_id === "string"
        ? meta.payment_public_id
        : null;
  return fromMeta;
}

function amountMinor(data: Record<string, unknown>): number {
  const n = Number(data.amount ?? data.amount_refunded ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function currencyOf(data: Record<string, unknown>): string {
  return String(data.currency ?? "NGN").toUpperCase();
}

function referenceOf(data: Record<string, unknown>): string {
  return String(
    data.reference ??
      data.transaction_reference ??
      data.id ??
      `paystack_${Date.now()}`,
  );
}

function occurredAtOf(data: Record<string, unknown>): string {
  const raw =
    data.paid_at ??
    data.refunded_at ??
    data.created_at ??
    data.updated_at ??
    null;
  if (typeof raw === "string" && raw.length > 0) return raw;
  return new Date().toISOString();
}

/**
 * Map Paystack event name → normalized domain type (or null = log-only unknown).
 */
export function mapPaystackEventType(
  eventName: string,
): NormalizedPaymentEvent["type"] | "log_only" | null {
  switch (eventName) {
    case "charge.success":
      return "payment.succeeded";
    case "transfer.success":
      return "transfer.succeeded";
    case "transfer.failed":
      return "transfer.failed";
    case "refund.processed":
      return "payment.refunded";
    case "subscription.create":
      return "subscription.created";
    case "subscription.disable":
      return "subscription.disabled";
    case "invoice.create":
      return "invoice.created";
    case "invoice.payment_failed":
      return "invoice.payment_failed";
    default:
      return null;
  }
}

export function normalizePaystackWebhook(
  raw: Record<string, unknown>,
): NormalizedPaymentEvent | null {
  const eventName = String(raw.event ?? "");
  const mapped = mapPaystackEventType(eventName);
  if (!mapped || mapped === "log_only") return null;

  const data = asRecord(raw.data);
  const providerRef = referenceOf(data);
  const paymentPublicId = metadataPublicId(data);
  const type = mapped;

  return {
    type,
    provider: "paystack",
    providerRef,
    paymentPublicId,
    amountMinor: amountMinor(data),
    currency: currencyOf(data),
    occurredAt: occurredAtOf(data),
    idempotencyKey: `paystack:${eventName}:${providerRef}:${String(data.id ?? providerRef)}`,
    raw: {
      ...raw,
      event: eventName,
      eventVersion: "paystack.v1",
      supported: isSupportedPaystackEvent(eventName),
    },
  };
}

export function extractPaystackEventId(
  raw: Record<string, unknown>,
): string {
  const data = asRecord(raw.data);
  const event = String(raw.event ?? "unknown");
  const id = data.id ?? data.reference ?? `${event}:${Date.now()}`;
  return `paystack:${event}:${String(id)}`;
}

export function extractPaystackOccurredAt(
  raw: Record<string, unknown>,
): string | null {
  const data = asRecord(raw.data);
  const rawTs =
    data.paid_at ?? data.created_at ?? data.refunded_at ?? data.updated_at;
  return typeof rawTs === "string" ? rawTs : null;
}
