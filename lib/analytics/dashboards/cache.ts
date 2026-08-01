/**
 * Dashboard + widget cache (TTL, manual refresh).
 */

import type { DashboardViewModel } from "@/lib/analytics/dashboards/types";
import { DASHBOARD_CACHE_TTL_MS } from "@/lib/analytics/dashboards/config";

type CacheEntry = {
  value: DashboardViewModel;
  expiresAt: number;
};

const store = new Map<string, CacheEntry>();
let hits = 0;
let misses = 0;

export function dashboardCacheKey(parts: {
  type: string;
  organizationId?: string | null;
  campaignId?: string | null;
  workerUserId?: string | null;
  permissionsKey?: string;
}): string {
  return [
    parts.type,
    parts.organizationId ?? "_",
    parts.campaignId ?? "_",
    parts.workerUserId ?? "_",
    parts.permissionsKey ?? "_",
  ].join("|");
}

export function getCachedDashboard(
  key: string,
): DashboardViewModel | null {
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
  return { ...entry.value, cacheHit: true, widgets: entry.value.widgets.map((w) => ({ ...w, cached: true })) };
}

export function setCachedDashboard(
  key: string,
  value: DashboardViewModel,
  ttlMs: number = DASHBOARD_CACHE_TTL_MS,
): void {
  const ttl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : 60_000;
  store.set(key, {
    value: { ...value, cacheHit: false },
    expiresAt: Date.now() + ttl,
  });
}

export function invalidateDashboardCache(prefix?: string): number {
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

export function getDashboardCacheStats(): {
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

export function resetDashboardCacheForTests(): void {
  store.clear();
  hits = 0;
  misses = 0;
}

export const DashboardCache = {
  get: getCachedDashboard,
  set: setCachedDashboard,
  invalidate: invalidateDashboardCache,
  stats: getDashboardCacheStats,
  key: dashboardCacheKey,
};
