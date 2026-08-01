/**
 * SubscriptionRegistry — CRUD for webhook subscriptions.
 */

import { createHash } from "node:crypto";
import {
  allocateWebhookIds,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  saveSubscription,
} from "@/lib/webhooks/store";
import { setWebhookSubscriptionCounts } from "@/lib/webhooks/telemetry";
import {
  DEFAULT_RETRY_POLICY,
  WEBHOOK_EVENT_TYPES,
  type WebhookEventType,
  type WebhookFilters,
  type WebhookRetryPolicy,
  type WebhookSubscription,
} from "@/lib/webhooks/types";

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function syncCounts(): void {
  const all = listSubscriptions();
  setWebhookSubscriptionCounts(
    all.filter((s) => s.enabled).length,
    all.length,
  );
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function createSubscription(input: {
  organizationId: string;
  endpointUrl: string;
  eventTypes: WebhookEventType[];
  filters?: WebhookFilters;
  retryPolicy?: Partial<WebhookRetryPolicy>;
  enabled?: boolean;
}): { subscription: WebhookSubscription; secret: string } | { error: string } {
  if (!input.organizationId) return { error: "organizationId required" };
  if (!isValidUrl(input.endpointUrl)) return { error: "Invalid endpoint URL" };
  if (!input.eventTypes.length) return { error: "At least one event type required" };
  for (const e of input.eventTypes) {
    if (!(WEBHOOK_EVENT_TYPES as readonly string[]).includes(e)) {
      return { error: `Unknown event type: ${e}` };
    }
  }

  const ids = allocateWebhookIds();
  const secret = ids.secret;
  const now = new Date().toISOString();
  const subscription: WebhookSubscription = {
    id: ids.subscriptionId,
    publicId: ids.publicId,
    organizationId: input.organizationId,
    endpointUrl: input.endpointUrl,
    secretHash: hashSecret(secret),
    secretPrefix: secret.slice(0, 10),
    eventTypes: [...input.eventTypes],
    filters: input.filters ?? {},
    retryPolicy: { ...DEFAULT_RETRY_POLICY, ...input.retryPolicy },
    apiVersion: "v1",
    enabled: input.enabled ?? true,
    createdAt: now,
    updatedAt: now,
  };
  saveSubscription(subscription);
  syncCounts();
  return { subscription, secret };
}

export function updateSubscription(
  id: string,
  patch: Partial<{
    endpointUrl: string;
    eventTypes: WebhookEventType[];
    filters: WebhookFilters;
    retryPolicy: Partial<WebhookRetryPolicy>;
    enabled: boolean;
  }>,
): WebhookSubscription | { error: string } {
  const existing = getSubscription(id);
  if (!existing) return { error: "Subscription not found" };
  if (patch.endpointUrl && !isValidUrl(patch.endpointUrl)) {
    return { error: "Invalid endpoint URL" };
  }
  if (patch.eventTypes) {
    for (const e of patch.eventTypes) {
      if (!(WEBHOOK_EVENT_TYPES as readonly string[]).includes(e)) {
        return { error: `Unknown event type: ${e}` };
      }
    }
  }
  const next: WebhookSubscription = {
    ...existing,
    endpointUrl: patch.endpointUrl ?? existing.endpointUrl,
    eventTypes: patch.eventTypes ?? existing.eventTypes,
    filters: patch.filters ?? existing.filters,
    retryPolicy: patch.retryPolicy
      ? { ...existing.retryPolicy, ...patch.retryPolicy }
      : existing.retryPolicy,
    enabled: patch.enabled ?? existing.enabled,
    updatedAt: new Date().toISOString(),
  };
  saveSubscription(next);
  syncCounts();
  return next;
}

export function rotateSubscriptionSecret(
  id: string,
): { subscription: WebhookSubscription; secret: string } | { error: string } {
  const existing = getSubscription(id);
  if (!existing) return { error: "Subscription not found" };
  const secret = allocateWebhookIds().secret;
  const next: WebhookSubscription = {
    ...existing,
    secretHash: hashSecret(secret),
    secretPrefix: secret.slice(0, 10),
    updatedAt: new Date().toISOString(),
  };
  saveSubscription(next);
  return { subscription: next, secret };
}

export function removeSubscription(id: string): boolean {
  const ok = deleteSubscription(id);
  syncCounts();
  return ok;
}

/** In-memory plaintext secret map for delivery signing (create/rotate only) */
const plaintextSecrets = new Map<string, string>();

export function rememberSecret(subscriptionId: string, secret: string): void {
  plaintextSecrets.set(subscriptionId, secret);
}

export function getPlaintextSecret(subscriptionId: string): string | null {
  return plaintextSecrets.get(subscriptionId) ?? null;
}

export function clearSecretsForTests(): void {
  plaintextSecrets.clear();
}

export const SubscriptionRegistry = {
  create: createSubscription,
  update: updateSubscription,
  rotateSecret: rotateSubscriptionSecret,
  remove: removeSubscription,
  get: getSubscription,
  list: listSubscriptions,
  rememberSecret,
  getSecret: getPlaintextSecret,
};
