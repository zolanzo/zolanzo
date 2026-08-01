/**
 * DeliveryHistoryService — persistence of delivery attempts & status.
 */

import {
  appendAttempt,
  getDelivery,
  listAttempts,
  listDeliveries,
} from "@/lib/webhooks/store";
import type {
  DeliveryAttemptStatus,
  WebhookDeliveryAttempt,
  WebhookDeliveryRecord,
} from "@/lib/webhooks/types";
import { allocateWebhookIds } from "@/lib/webhooks/store";

export function recordAttempt(input: {
  delivery: WebhookDeliveryRecord;
  attempt: number;
  status: DeliveryAttemptStatus;
  responseCode: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
}): WebhookDeliveryAttempt {
  const row: WebhookDeliveryAttempt = {
    id: allocateWebhookIds().attemptId,
    deliveryId: input.delivery.id,
    subscriptionId: input.delivery.subscriptionId,
    eventId: input.delivery.eventId,
    eventType: input.delivery.eventType,
    attempt: input.attempt,
    status: input.status,
    responseCode: input.responseCode,
    latencyMs: input.latencyMs,
    errorMessage: input.errorMessage,
    createdAt: new Date().toISOString(),
  };
  appendAttempt(row);
  return row;
}

export function getDeliveryHistory(filter?: {
  subscriptionId?: string;
  organizationId?: string;
  status?: string;
  limit?: number;
}): WebhookDeliveryRecord[] {
  return listDeliveries(filter);
}

export function getDeliveryDetail(deliveryId: string): {
  delivery: WebhookDeliveryRecord;
  attempts: WebhookDeliveryAttempt[];
} | null {
  const delivery = getDelivery(deliveryId);
  if (!delivery) return null;
  return { delivery, attempts: listAttempts(deliveryId) };
}

export const DeliveryHistoryService = {
  recordAttempt,
  list: getDeliveryHistory,
  get: getDeliveryDetail,
};
