/**
 * ReplayService — re-deliver a historical webhook delivery.
 */

import { isWebhookReplayEnabled } from "@/lib/webhooks/config";
import { DeliveryScheduler } from "@/lib/webhooks/delivery-scheduler";
import {
  allocateWebhookIds,
  enqueuePending,
  getDelivery,
  getSubscription,
  saveDelivery,
} from "@/lib/webhooks/store";
import type { WebhookDeliveryRecord } from "@/lib/webhooks/types";

export async function replayDelivery(
  deliveryId: string,
): Promise<{ ok: true; delivery: WebhookDeliveryRecord } | { ok: false; error: string }> {
  if (!isWebhookReplayEnabled()) {
    return { ok: false, error: "WEBHOOK_REPLAY disabled" };
  }
  const original = getDelivery(deliveryId);
  if (!original) return { ok: false, error: "Delivery not found" };
  const subscription = getSubscription(original.subscriptionId);
  if (!subscription) return { ok: false, error: "Subscription not found" };

  const newId = allocateWebhookIds().deliveryId;
  const replay: WebhookDeliveryRecord = {
    ...original,
    id: newId,
    envelope: {
      ...original.envelope,
      deliveryId: newId,
    },
    status: "queued",
    attempts: 0,
    nextRetryAt: Date.now(),
    lastError: null,
    lastResponseCode: null,
    lastLatencyMs: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replayOf: original.id,
  };
  saveDelivery(replay);
  enqueuePending(replay.id);
  const delivered = await DeliveryScheduler.deliverNow(replay.id, {
    replay: true,
  });
  if (!delivered) return { ok: false, error: "Replay failed to start" };
  return { ok: true, delivery: delivered };
}

export const ReplayService = {
  replay: replayDelivery,
};
