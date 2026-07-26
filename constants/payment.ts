/**
 * Payment platform enums — provider-agnostic.
 */

export const PAYMENT_PROVIDER_KEYS = [
  "paystack",
  "flutterwave",
  "stripe",
  "monnify",
  "memory",
] as const;

export type PaymentProviderKey = (typeof PAYMENT_PROVIDER_KEYS)[number];

export const PAYMENT_CAPABILITIES = [
  "accepts_payments",
  "bank_transfers",
  "refunds",
  "split_payments",
  "recurring_billing",
  "virtual_accounts",
  "webhooks",
  "multi_currency",
  "payouts",
] as const;

export type PaymentCapability = (typeof PAYMENT_CAPABILITIES)[number];

export const PAYMENT_INTENT_PURPOSES = [
  "campaign_funding",
  "wallet_topup",
  "organization_funding",
] as const;

export type PaymentIntentPurpose = (typeof PAYMENT_INTENT_PURPOSES)[number];

export const PAYMENT_INTENT_STATUSES = [
  "draft",
  "pending_provider",
  "awaiting_payment",
  "succeeded",
  "failed",
  "cancelled",
  "expired",
] as const;

export type PaymentIntentStatus = (typeof PAYMENT_INTENT_STATUSES)[number];

export const PAYMENT_RECORD_STATUSES = [
  "pending",
  "verified",
  "failed",
  "refunded",
] as const;

export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

export const NORMALIZED_PAYMENT_EVENT_TYPES = [
  "payment.initiated",
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "payment.chargeback",
] as const;

export type NormalizedPaymentEventType =
  (typeof NORMALIZED_PAYMENT_EVENT_TYPES)[number];

export const PAYMENT_INTENT_TRANSITIONS: Record<
  PaymentIntentStatus,
  readonly PaymentIntentStatus[]
> = {
  draft: ["pending_provider", "cancelled"],
  pending_provider: ["awaiting_payment", "failed", "cancelled"],
  awaiting_payment: ["succeeded", "failed", "cancelled", "expired"],
  succeeded: [],
  failed: ["draft", "cancelled"],
  cancelled: [],
  expired: [],
};
