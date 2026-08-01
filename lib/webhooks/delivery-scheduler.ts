/**
 * DeliveryScheduler — HTTP delivery with timeout, retry, DLQ.
 */

import {
  isWebhookDeliveryEnabled,
} from "@/lib/webhooks/config";
import { FilterEngine } from "@/lib/webhooks/filter-engine";
import { SignatureService } from "@/lib/webhooks/signature-service";
import { RetryEngine } from "@/lib/webhooks/retry-engine";
import { DeliveryHistoryService } from "@/lib/webhooks/delivery-history";
import { getPlaintextSecret } from "@/lib/webhooks/subscription-registry";
import {
  allocateWebhookIds,
  dequeueDue,
  enqueuePending,
  getSubscription,
  listSubscriptions,
  saveDelivery,
} from "@/lib/webhooks/store";
import { recordWebhookDelivery } from "@/lib/webhooks/telemetry";
import type {
  PlatformWebhookEvent,
  WebhookDeliveryRecord,
  WebhookEventEnvelope,
  WebhookSubscription,
} from "@/lib/webhooks/types";

export type WebhookHttpTransport = (input: {
  url: string;
  body: string;
  headers: Record<string, string>;
  timeoutMs: number;
}) => Promise<{ status: number; latencyMs: number; error?: string }>;

let transport: WebhookHttpTransport = defaultFetchTransport;

export function setWebhookTransport(next: WebhookHttpTransport): void {
  transport = next;
}

export function resetWebhookTransport(): void {
  transport = defaultFetchTransport;
}

async function defaultFetchTransport(input: {
  url: string;
  body: string;
  headers: Record<string, string>;
  timeoutMs: number;
}): Promise<{ status: number; latencyMs: number; error?: string }> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    const res = await fetch(input.url, {
      method: "POST",
      headers: input.headers,
      body: input.body,
      signal: controller.signal,
    });
    return { status: res.status, latencyMs: Date.now() - started };
  } catch (e) {
    return {
      status: 0,
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildEnvelope(
  event: PlatformWebhookEvent,
  deliveryId: string,
): WebhookEventEnvelope {
  const data = { ...event.data };
  if (event.event === "forecast.generated" && data.advisoryOnly == null) {
    data.advisoryOnly = true;
  }
  return {
    id: event.id,
    event: event.event,
    occurredAt: event.occurredAt,
    version: "v1",
    data,
    requestId: event.requestId,
    deliveryId,
  };
}

function createDelivery(
  subscription: WebhookSubscription,
  event: PlatformWebhookEvent,
  replayOf: string | null = null,
): WebhookDeliveryRecord {
  const deliveryId = allocateWebhookIds().deliveryId;
  const envelope = buildEnvelope(event, deliveryId);
  const record: WebhookDeliveryRecord = {
    id: deliveryId,
    subscriptionId: subscription.id,
    organizationId: subscription.organizationId,
    eventId: event.id,
    eventType: event.event,
    envelope,
    status: "queued",
    attempts: 0,
    maxAttempts: subscription.retryPolicy.maxAttempts,
    nextRetryAt: Date.now(),
    lastError: null,
    lastResponseCode: null,
    lastLatencyMs: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replayOf,
  };
  saveDelivery(record);
  enqueuePending(record.id);
  return record;
}

export function enqueueEvent(event: PlatformWebhookEvent): WebhookDeliveryRecord[] {
  if (!isWebhookDeliveryEnabled()) return [];
  const matched = listSubscriptions({ enabled: true }).filter((s) =>
    FilterEngine.subscriptionMatches(s, event),
  );
  return matched.map((s) => createDelivery(s, event));
}

async function attemptDelivery(
  record: WebhookDeliveryRecord,
  opts?: { replay?: boolean },
): Promise<WebhookDeliveryRecord> {
  const subscription = getSubscription(record.subscriptionId);
  if (!subscription || !subscription.enabled) {
    record.status = "failed";
    record.lastError = "Subscription missing or disabled";
    record.updatedAt = new Date().toISOString();
    saveDelivery(record);
    return record;
  }

  const secret = getPlaintextSecret(subscription.id);
  if (!secret) {
    record.status = "failed";
    record.lastError = "Subscription secret unavailable";
    record.updatedAt = new Date().toISOString();
    saveDelivery(record);
    return record;
  }

  const attempt = record.attempts + 1;
  record.attempts = attempt;
  const body = JSON.stringify(record.envelope);
  const headers = SignatureService.headers({
    secret,
    event: record.eventType,
    deliveryId: record.id,
    body,
  });

  const result = await transport({
    url: subscription.endpointUrl,
    body,
    headers,
    timeoutMs: subscription.retryPolicy.timeoutMs,
  });

  const ok = result.status >= 200 && result.status < 300;
  DeliveryHistoryService.recordAttempt({
    delivery: record,
    attempt,
    status: ok ? "delivered" : "failed",
    responseCode: result.status || null,
    latencyMs: result.latencyMs,
    errorMessage: result.error ?? (ok ? null : `HTTP ${result.status}`),
  });

  record.lastLatencyMs = result.latencyMs;
  record.lastResponseCode = result.status || null;
  record.updatedAt = new Date().toISOString();

  if (ok) {
    record.status = opts?.replay ? "replayed" : "delivered";
    record.nextRetryAt = null;
    record.lastError = null;
    saveDelivery(record);
    recordWebhookDelivery({
      ok: true,
      latencyMs: result.latencyMs,
      replay: opts?.replay,
    });
    return record;
  }

  record.lastError = result.error ?? `HTTP ${result.status}`;
  const retry = RetryEngine.shouldRetry(
    attempt,
    subscription.retryPolicy,
    result.status || null,
  );
  if (retry) {
    record.status = "failed";
    record.nextRetryAt = RetryEngine.nextRetryAt(
      attempt,
      subscription.retryPolicy,
    );
    saveDelivery(record);
    enqueuePending(record.id);
    recordWebhookDelivery({
      ok: false,
      latencyMs: result.latencyMs,
      retry: true,
      replay: opts?.replay,
    });
    return record;
  }

  record.status = "dead_letter";
  record.nextRetryAt = null;
  saveDelivery(record);
  recordWebhookDelivery({
    ok: false,
    latencyMs: result.latencyMs,
    deadLetter: true,
    replay: opts?.replay,
  });
  return record;
}

/** Max concurrent outbound webhook HTTP attempts per scheduler tick. */
const WEBHOOK_DELIVERY_CONCURRENCY = 8;

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const limit = Math.max(1, concurrency);
  let next = 0;
  async function runWorker(): Promise<void> {
    while (next < items.length) {
      const idx = next;
      next += 1;
      await worker(items[idx]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker()),
  );
}

export async function processDueDeliveries(limit = 50): Promise<number> {
  if (!isWebhookDeliveryEnabled()) return 0;
  const due = dequeueDue().slice(0, limit);
  await mapPool(due, WEBHOOK_DELIVERY_CONCURRENCY, async (d) => {
    await attemptDelivery(d);
  });
  return due.length;
}

export async function deliverNow(
  deliveryId: string,
  opts?: { replay?: boolean },
): Promise<WebhookDeliveryRecord | null> {
  const { getDelivery } = await import("@/lib/webhooks/store");
  const record = getDelivery(deliveryId);
  if (!record) return null;
  return attemptDelivery(record, opts);
}

export const DeliveryScheduler = {
  enqueue: enqueueEvent,
  processDue: processDueDeliveries,
  deliverNow,
  setTransport: setWebhookTransport,
  resetTransport: resetWebhookTransport,
};
