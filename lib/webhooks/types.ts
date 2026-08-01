/**
 * Webhooks & Event Subscriptions — Phase 4.5B types.
 * Outbound only — never publishes into domain.
 */

export const WEBHOOK_MODEL_VERSION = "webhooks/1.0.0";

export const WEBHOOK_EVENT_TYPES = [
  "worker.created",
  "organization.created",
  "identity.verified",
  "campaign.created",
  "campaign.updated",
  "campaign.completed",
  "assignment.claimed",
  "assignment.completed",
  "assignment.expired",
  "review.completed",
  "review.approved",
  "review.rejected",
  "payment.completed",
  "settlement.completed",
  "trust.updated",
  "trust.badge_awarded",
  "report.generated",
  "forecast.generated",
  "automation.rule.published",
  "automation.execution.completed",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export type WebhookRetryPolicy = {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  timeoutMs: number;
};

export type WebhookFilters = {
  organizationId?: string | null;
  campaignId?: string | null;
  region?: string | null;
  workerId?: string | null;
};

export type WebhookSubscription = {
  id: string;
  publicId: string;
  organizationId: string;
  endpointUrl: string;
  /** Hashed secret — plaintext only returned on create/rotate */
  secretHash: string;
  secretPrefix: string;
  eventTypes: WebhookEventType[];
  filters: WebhookFilters;
  retryPolicy: WebhookRetryPolicy;
  apiVersion: "v1";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEventEnvelope = {
  id: string;
  event: WebhookEventType;
  occurredAt: string;
  version: "v1";
  data: Record<string, unknown>;
  requestId: string;
  deliveryId: string;
};

export type PlatformWebhookEvent = {
  id: string;
  event: WebhookEventType;
  occurredAt: string;
  requestId: string;
  organizationId?: string | null;
  campaignId?: string | null;
  region?: string | null;
  workerId?: string | null;
  data: Record<string, unknown>;
};

export type DeliveryAttemptStatus =
  | "queued"
  | "delivered"
  | "failed"
  | "dead_letter"
  | "replayed";

export type WebhookDeliveryAttempt = {
  id: string;
  deliveryId: string;
  subscriptionId: string;
  eventId: string;
  eventType: WebhookEventType;
  attempt: number;
  status: DeliveryAttemptStatus;
  responseCode: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
  createdAt: string;
};

export type WebhookDeliveryRecord = {
  id: string;
  subscriptionId: string;
  organizationId: string;
  eventId: string;
  eventType: WebhookEventType;
  envelope: WebhookEventEnvelope;
  status: DeliveryAttemptStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number | null;
  lastError: string | null;
  lastResponseCode: number | null;
  lastLatencyMs: number | null;
  createdAt: string;
  updatedAt: string;
  replayOf: string | null;
};

export type WebhookHealthCounters = {
  subscriptions: number;
  activeSubscriptions: number;
  deliveries: number;
  successes: number;
  failures: number;
  retries: number;
  deadLetters: number;
  replays: number;
  totalLatencyMs: number;
  lastAt: string | null;
};

export const DEFAULT_RETRY_POLICY: WebhookRetryPolicy = {
  maxAttempts: 5,
  initialBackoffMs: 1_000,
  maxBackoffMs: 60_000,
  timeoutMs: 5_000,
};
