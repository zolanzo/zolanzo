/**
 * Webhook telemetry.
 */

import type { WebhookHealthCounters } from "@/lib/webhooks/types";

const counters: WebhookHealthCounters = {
  subscriptions: 0,
  activeSubscriptions: 0,
  deliveries: 0,
  successes: 0,
  failures: 0,
  retries: 0,
  deadLetters: 0,
  replays: 0,
  totalLatencyMs: 0,
  lastAt: null,
};

export function setWebhookSubscriptionCounts(active: number, total: number): void {
  counters.activeSubscriptions = active;
  counters.subscriptions = total;
}

export function recordWebhookDelivery(input: {
  ok: boolean;
  latencyMs: number;
  retry?: boolean;
  deadLetter?: boolean;
  replay?: boolean;
}): void {
  counters.deliveries += 1;
  counters.totalLatencyMs += Math.max(0, input.latencyMs);
  counters.lastAt = new Date().toISOString();
  if (input.ok) counters.successes += 1;
  else counters.failures += 1;
  if (input.retry) counters.retries += 1;
  if (input.deadLetter) counters.deadLetters += 1;
  if (input.replay) counters.replays += 1;
}

export function getWebhookTelemetrySnapshot(): WebhookHealthCounters & {
  successRate: number;
  averageLatencyMs: number;
  deliveriesPerMinuteEstimate: number;
} {
  const successRate =
    counters.deliveries === 0
      ? 1
      : Math.round((counters.successes / counters.deliveries) * 1000) / 1000;
  const averageLatencyMs =
    counters.deliveries === 0
      ? 0
      : Math.round(counters.totalLatencyMs / counters.deliveries);
  return {
    ...counters,
    successRate,
    averageLatencyMs,
    deliveriesPerMinuteEstimate: counters.deliveries,
  };
}

export function resetWebhookTelemetryForTests(): void {
  counters.subscriptions = 0;
  counters.activeSubscriptions = 0;
  counters.deliveries = 0;
  counters.successes = 0;
  counters.failures = 0;
  counters.retries = 0;
  counters.deadLetters = 0;
  counters.replays = 0;
  counters.totalLatencyMs = 0;
  counters.lastAt = null;
}
