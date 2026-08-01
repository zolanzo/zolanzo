/**
 * In-memory webhook store — subscriptions, deliveries, DLQ, attempts.
 */

import type {
  WebhookDeliveryAttempt,
  WebhookDeliveryRecord,
  WebhookSubscription,
} from "@/lib/webhooks/types";

let seq = 0;
const subscriptions = new Map<string, WebhookSubscription>();
const deliveries = new Map<string, WebhookDeliveryRecord>();
const attempts: WebhookDeliveryAttempt[] = [];
const pending: string[] = [];

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

function nextPublicId(prefix: string): string {
  seq += 1;
  const body = seq.toString(36).toUpperCase().padStart(6, "2").slice(-6);
  return `${prefix}-${body}`;
}

export function resetWebhookStoreForTests(): void {
  seq = 0;
  subscriptions.clear();
  deliveries.clear();
  attempts.length = 0;
  pending.length = 0;
}

export function allocateWebhookIds() {
  return {
    subscriptionId: nextId("whsub"),
    publicId: nextPublicId("WHS"),
    deliveryId: nextId("whdel"),
    attemptId: nextId("whatm"),
    eventId: nextId("whevt"),
    secret: `whsec_${nextId("s")}_${Date.now().toString(36)}`,
  };
}

export function saveSubscription(sub: WebhookSubscription): WebhookSubscription {
  subscriptions.set(sub.id, sub);
  return sub;
}

export function getSubscription(id: string): WebhookSubscription | null {
  return subscriptions.get(id) ?? null;
}

export function deleteSubscription(id: string): boolean {
  return subscriptions.delete(id);
}

export function listSubscriptions(filter?: {
  organizationId?: string;
  enabled?: boolean;
}): WebhookSubscription[] {
  let rows = [...subscriptions.values()];
  if (filter?.organizationId) {
    rows = rows.filter((s) => s.organizationId === filter.organizationId);
  }
  if (filter?.enabled != null) {
    rows = rows.filter((s) => s.enabled === filter.enabled);
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveDelivery(record: WebhookDeliveryRecord): void {
  deliveries.set(record.id, record);
}

export function getDelivery(id: string): WebhookDeliveryRecord | null {
  return deliveries.get(id) ?? null;
}

export function listDeliveries(filter?: {
  subscriptionId?: string;
  organizationId?: string;
  status?: string;
  limit?: number;
}): WebhookDeliveryRecord[] {
  let rows = [...deliveries.values()];
  if (filter?.subscriptionId) {
    rows = rows.filter((d) => d.subscriptionId === filter.subscriptionId);
  }
  if (filter?.organizationId) {
    rows = rows.filter((d) => d.organizationId === filter.organizationId);
  }
  if (filter?.status) {
    rows = rows.filter((d) => d.status === filter.status);
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.limit) rows = rows.slice(0, filter.limit);
  return rows;
}

export function appendAttempt(attempt: WebhookDeliveryAttempt): void {
  attempts.push(attempt);
}

export function listAttempts(deliveryId: string): WebhookDeliveryAttempt[] {
  return attempts
    .filter((a) => a.deliveryId === deliveryId)
    .sort((a, b) => a.attempt - b.attempt);
}

export function enqueuePending(deliveryId: string): void {
  if (!pending.includes(deliveryId)) pending.push(deliveryId);
}

export function dequeueDue(now = Date.now()): WebhookDeliveryRecord[] {
  const due: WebhookDeliveryRecord[] = [];
  const remaining: string[] = [];
  for (const id of pending) {
    const d = deliveries.get(id);
    if (!d) continue;
    if (
      d.status === "delivered" ||
      d.status === "dead_letter" ||
      d.status === "replayed"
    ) {
      continue;
    }
    if (d.nextRetryAt == null || d.nextRetryAt <= now) {
      due.push(d);
    } else {
      remaining.push(id);
    }
  }
  pending.length = 0;
  pending.push(...remaining);
  return due;
}

export function countDeadLetters(): number {
  return [...deliveries.values()].filter((d) => d.status === "dead_letter").length;
}

export { nextId, nextPublicId };
