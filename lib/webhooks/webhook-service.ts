/**
 * WebhookService — public API for subscriptions + event fan-out.
 * Consumes committed platform events; never mutates domains.
 */

import {
  isPublicWebhooksEnabled,
  isWebhookDeliveryEnabled,
  isWebhookReplayEnabled,
} from "@/lib/webhooks/config";
import { SubscriptionRegistry } from "@/lib/webhooks/subscription-registry";
import { DeliveryScheduler } from "@/lib/webhooks/delivery-scheduler";
import { DeliveryHistoryService } from "@/lib/webhooks/delivery-history";
import { ReplayService } from "@/lib/webhooks/replay-service";
import { getWebhookTelemetrySnapshot } from "@/lib/webhooks/telemetry";
import { countDeadLetters, listSubscriptions } from "@/lib/webhooks/store";
import { allocateWebhookIds } from "@/lib/webhooks/store";
import type {
  PlatformWebhookEvent,
  WebhookEventType,
  WebhookFilters,
  WebhookRetryPolicy,
  WebhookSubscription,
} from "@/lib/webhooks/types";
import { WEBHOOK_MODEL_VERSION } from "@/lib/webhooks/types";

function publicView(sub: WebhookSubscription, secret?: string) {
  return {
    id: sub.id,
    publicId: sub.publicId,
    organizationId: sub.organizationId,
    endpointUrl: sub.endpointUrl,
    secretPrefix: sub.secretPrefix,
    ...(secret ? { secret } : {}),
    eventTypes: sub.eventTypes,
    filters: sub.filters,
    retryPolicy: sub.retryPolicy,
    apiVersion: sub.apiVersion,
    enabled: sub.enabled,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

export function publishWebhookEvent(input: {
  event: WebhookEventType;
  data: Record<string, unknown>;
  organizationId?: string | null;
  campaignId?: string | null;
  region?: string | null;
  workerId?: string | null;
  requestId?: string;
  occurredAt?: string;
}): { queued: number; eventId: string } {
  if (!isPublicWebhooksEnabled() || !isWebhookDeliveryEnabled()) {
    return { queued: 0, eventId: "" };
  }
  const ids = allocateWebhookIds();
  const platformEvent: PlatformWebhookEvent = {
    id: ids.eventId,
    event: input.event,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    requestId: input.requestId ?? `wreq_${ids.eventId}`,
    organizationId: input.organizationId ?? null,
    campaignId: input.campaignId ?? null,
    region: input.region ?? null,
    workerId: input.workerId ?? null,
    data: input.data,
  };
  const deliveries = DeliveryScheduler.enqueue(platformEvent);
  return { queued: deliveries.length, eventId: platformEvent.id };
}

export const WebhookService = {
  createSubscription(input: {
    organizationId: string;
    endpointUrl: string;
    eventTypes: WebhookEventType[];
    filters?: WebhookFilters;
    retryPolicy?: Partial<WebhookRetryPolicy>;
    enabled?: boolean;
  }) {
    if (!isPublicWebhooksEnabled()) {
      return { ok: false as const, error: "PUBLIC_WEBHOOKS disabled" };
    }
    const result = SubscriptionRegistry.create(input);
    if ("error" in result) return { ok: false as const, error: result.error };
    SubscriptionRegistry.rememberSecret(
      result.subscription.id,
      result.secret,
    );
    return {
      ok: true as const,
      subscription: publicView(result.subscription, result.secret),
    };
  },

  updateSubscription(
    id: string,
    patch: Parameters<typeof SubscriptionRegistry.update>[1],
  ) {
    if (!isPublicWebhooksEnabled()) {
      return { ok: false as const, error: "PUBLIC_WEBHOOKS disabled" };
    }
    const result = SubscriptionRegistry.update(id, patch);
    if ("error" in result) return { ok: false as const, error: result.error };
    return { ok: true as const, subscription: publicView(result) };
  },

  deleteSubscription(id: string) {
    if (!isPublicWebhooksEnabled()) return false;
    return SubscriptionRegistry.remove(id);
  },

  rotateSecret(id: string) {
    if (!isPublicWebhooksEnabled()) {
      return { ok: false as const, error: "PUBLIC_WEBHOOKS disabled" };
    }
    const result = SubscriptionRegistry.rotateSecret(id);
    if ("error" in result) return { ok: false as const, error: result.error };
    SubscriptionRegistry.rememberSecret(
      result.subscription.id,
      result.secret,
    );
    return {
      ok: true as const,
      subscription: publicView(result.subscription, result.secret),
    };
  },

  listSubscriptions(organizationId?: string) {
    if (!isPublicWebhooksEnabled()) return [];
    return listSubscriptions(
      organizationId ? { organizationId } : undefined,
    ).map((s) => publicView(s));
  },

  getSubscription(id: string) {
    const s = SubscriptionRegistry.get(id);
    return s ? publicView(s) : null;
  },

  listHistory(filter?: {
    subscriptionId?: string;
    organizationId?: string;
    status?: string;
    limit?: number;
  }) {
    return DeliveryHistoryService.list(filter);
  },

  getDelivery(id: string) {
    return DeliveryHistoryService.get(id);
  },

  async replay(deliveryId: string) {
    if (!isWebhookReplayEnabled()) {
      return { ok: false as const, error: "WEBHOOK_REPLAY disabled" };
    }
    return ReplayService.replay(deliveryId);
  },

  async flush(limit?: number) {
    return DeliveryScheduler.processDue(limit);
  },

  publish: publishWebhookEvent,

  health() {
    const telemetry = getWebhookTelemetrySnapshot();
    return {
      webhooksEnabled: isPublicWebhooksEnabled(),
      deliveryEnabled: isWebhookDeliveryEnabled(),
      replayEnabled: isWebhookReplayEnabled(),
      modelVersion: WEBHOOK_MODEL_VERSION,
      ...telemetry,
      deadLetterQueue: countDeadLetters() || telemetry.deadLetters,
    };
  },
};
