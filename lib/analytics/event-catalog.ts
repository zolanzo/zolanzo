/**
 * Event → metric contribution catalog.
 */

import type {
  AnalyticsEventType,
  AnalyticsSource,
} from "@/lib/analytics/types";

export const EVENT_SOURCE_MAP: Record<AnalyticsEventType, AnalyticsSource> = {
  "assignment.created": "assignments",
  "assignment.completed": "assignments",
  "campaign.created": "campaigns",
  "campaign.completed": "campaigns",
  "payment.completed": "payments",
  "payment.failed": "payments",
  "trust.updated": "trust",
  "review.completed": "reviews",
  "worker.registered": "authentication",
  "organization.created": "organizations",
  "notification.sent": "notifications",
  "notification.failed": "notifications",
  "storage.uploaded": "storage",
  "login.success": "authentication",
  "login.failed": "authentication",
};

/** Primary metric key for an event (count). */
export function countMetricKey(eventType: AnalyticsEventType): string {
  return `${eventType}.count`;
}

/** Optional secondary keys (e.g. payment amounts). */
export function secondaryMetricKeys(
  eventType: AnalyticsEventType,
): string[] {
  if (eventType === "payment.completed" || eventType === "payment.failed") {
    return [`${eventType}.amount`];
  }
  return [];
}

export function defaultMetricValue(
  eventType: AnalyticsEventType,
  payload?: Record<string, unknown>,
  explicit?: number,
): number {
  if (explicit != null && Number.isFinite(explicit)) return explicit;
  if (
    eventType === "payment.completed" ||
    eventType === "payment.failed"
  ) {
    const amount = payload?.amountMinor;
    if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  }
  return 1;
}
