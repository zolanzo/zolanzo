/**
 * Simple in-process rate limiter for AI invocations.
 */

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

export function takeAiRateToken(params: {
  key: string;
  capacity?: number;
  refillPerSec?: number;
}): boolean {
  const capacity = params.capacity ?? 30;
  const refillPerSec = params.refillPerSec ?? 1;
  const now = Date.now();
  const existing = buckets.get(params.key) ?? {
    tokens: capacity,
    updatedAt: now,
  };
  const elapsedSec = (now - existing.updatedAt) / 1000;
  const refilled = Math.min(
    capacity,
    existing.tokens + elapsedSec * refillPerSec,
  );
  if (refilled < 1) {
    buckets.set(params.key, { tokens: refilled, updatedAt: now });
    return false;
  }
  buckets.set(params.key, { tokens: refilled - 1, updatedAt: now });
  return true;
}

export function resetAiRateLimiterForTests(): void {
  buckets.clear();
}
