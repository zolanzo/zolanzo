/**
 * Forecast cache — TTL + manual refresh.
 */

import type { ForecastResult } from "@/lib/analytics/forecast/types";
import { FORECAST_CACHE_TTL_MS } from "@/lib/analytics/forecast/config";

type Entry = { value: ForecastResult; expiresAt: number };

const store = new Map<string, Entry>();
let hits = 0;
let misses = 0;

export function forecastCacheKey(parts: {
  type: string;
  organizationId?: string | null;
  campaignId?: string | null;
  workerUserId?: string | null;
}): string {
  return [
    parts.type,
    parts.organizationId ?? "_",
    parts.campaignId ?? "_",
    parts.workerUserId ?? "_",
  ].join("|");
}

export function getCachedForecast(key: string): ForecastResult | null {
  const entry = store.get(key);
  if (!entry) {
    misses += 1;
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    misses += 1;
    return null;
  }
  hits += 1;
  return { ...entry.value, cached: true };
}

export function setCachedForecast(
  key: string,
  value: ForecastResult,
  ttlMs: number = FORECAST_CACHE_TTL_MS,
): void {
  const ttl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : 120_000;
  store.set(key, {
    value: { ...value, cached: false },
    expiresAt: Date.now() + ttl,
  });
}

export function invalidateForecastCache(prefix?: string): number {
  if (!prefix) {
    const n = store.size;
    store.clear();
    return n;
  }
  let removed = 0;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      removed += 1;
    }
  }
  return removed;
}

export function getForecastCacheStats(): {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
} {
  const total = hits + misses;
  return {
    size: store.size,
    hits,
    misses,
    hitRate: total > 0 ? hits / total : 0,
  };
}

export function resetForecastCacheForTests(): void {
  store.clear();
  hits = 0;
  misses = 0;
}

export const ForecastCache = {
  get: getCachedForecast,
  set: setCachedForecast,
  invalidate: invalidateForecastCache,
  stats: getForecastCacheStats,
  key: forecastCacheKey,
};
