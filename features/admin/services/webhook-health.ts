/**
 * Admin Webhook Health — Phase 4.5B.
 */

import "server-only";

import { WebhookService } from "@/lib/webhooks/webhook-service";

export type WebhookHealthSnapshot = {
  webhooksEnabled: boolean;
  deliveryEnabled: boolean;
  replayEnabled: boolean;
  modelVersion: string;
  activeSubscriptions: number;
  subscriptions: number;
  deliveriesPerMinute: number;
  successRate: number;
  retryRate: number;
  deadLetterQueue: number;
  replayCount: number;
  averageLatencyMs: number;
  generatedAt: string;
};

export async function getWebhookHealthSnapshot(): Promise<WebhookHealthSnapshot> {
  const health = WebhookService.health();
  const retryRate =
    health.deliveries === 0
      ? 0
      : Math.round((health.retries / health.deliveries) * 1000) / 1000;
  return {
    webhooksEnabled: health.webhooksEnabled,
    deliveryEnabled: health.deliveryEnabled,
    replayEnabled: health.replayEnabled,
    modelVersion: health.modelVersion,
    activeSubscriptions: health.activeSubscriptions,
    subscriptions: health.subscriptions,
    deliveriesPerMinute: health.deliveriesPerMinuteEstimate,
    successRate: health.successRate,
    retryRate,
    deadLetterQueue: health.deadLetterQueue,
    replayCount: health.replays,
    averageLatencyMs: health.averageLatencyMs,
    generatedAt: new Date().toISOString(),
  };
}
