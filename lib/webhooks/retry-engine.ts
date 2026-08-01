/**
 * RetryEngine — exponential backoff for webhook deliveries.
 */

import type { WebhookRetryPolicy } from "@/lib/webhooks/types";

export function computeBackoffMs(
  attempt: number,
  policy: WebhookRetryPolicy,
): number {
  const exp = Math.max(0, attempt - 1);
  const raw = policy.initialBackoffMs * 2 ** exp;
  return Math.min(raw, policy.maxBackoffMs);
}

export function shouldRetry(
  attempt: number,
  policy: WebhookRetryPolicy,
  responseCode: number | null,
): boolean {
  if (attempt >= policy.maxAttempts) return false;
  if (responseCode == null) return true;
  if (responseCode >= 500) return true;
  if (responseCode === 429) return true;
  // 408 Request Timeout
  if (responseCode === 408) return true;
  return false;
}

export function nextRetryAt(
  attempt: number,
  policy: WebhookRetryPolicy,
  now = Date.now(),
): number {
  return now + computeBackoffMs(attempt, policy);
}

export const RetryEngine = {
  backoff: computeBackoffMs,
  shouldRetry,
  nextRetryAt,
};
