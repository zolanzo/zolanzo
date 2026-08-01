/**
 * FilterEngine — subscription event + attribute filters.
 */

import type {
  PlatformWebhookEvent,
  WebhookFilters,
  WebhookSubscription,
} from "@/lib/webhooks/types";

export function matchesFilters(
  event: PlatformWebhookEvent,
  filters: WebhookFilters,
): boolean {
  if (
    filters.organizationId &&
    event.organizationId &&
    filters.organizationId !== event.organizationId
  ) {
    return false;
  }
  if (
    filters.campaignId &&
    event.campaignId &&
    filters.campaignId !== event.campaignId
  ) {
    return false;
  }
  if (filters.region && event.region && filters.region !== event.region) {
    return false;
  }
  if (
    filters.workerId &&
    event.workerId &&
    filters.workerId !== event.workerId
  ) {
    return false;
  }
  // If filter set but event lacks attribute, treat as non-match for safety
  if (filters.campaignId && !event.campaignId) return false;
  if (filters.region && !event.region) return false;
  if (filters.workerId && !event.workerId) return false;
  return true;
}

export function subscriptionMatchesEvent(
  subscription: WebhookSubscription,
  event: PlatformWebhookEvent,
): boolean {
  if (!subscription.enabled) return false;
  if (!subscription.eventTypes.includes(event.event)) return false;
  if (
    subscription.organizationId &&
    event.organizationId &&
    subscription.organizationId !== event.organizationId
  ) {
    return false;
  }
  return matchesFilters(event, subscription.filters);
}

export const FilterEngine = {
  matches: matchesFilters,
  subscriptionMatches: subscriptionMatchesEvent,
};
