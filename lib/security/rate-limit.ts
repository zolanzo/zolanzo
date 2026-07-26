/**
 * Rate limiting readiness layer.
 *
 * In-memory store for local/dev. Swap `store` for Redis
 * (RATE_LIMIT_REDIS_URL) in production for multi-instance safety.
 */

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  get(key: string): Promise<RateLimitEntry | undefined>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
};

class MemoryRateLimitStore implements RateLimitStore {
  private readonly map = new Map<string, RateLimitEntry>();

  async get(key: string): Promise<RateLimitEntry | undefined> {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.resetAt) {
      this.map.delete(key);
      return undefined;
    }
    return entry;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    this.map.set(key, entry);
    // Best-effort cleanup; Redis TTL replaces this in production.
    setTimeout(() => {
      const current = this.map.get(key);
      if (current && current.resetAt <= Date.now()) {
        this.map.delete(key);
      }
    }, ttlMs);
  }
}

const store: RateLimitStore = new MemoryRateLimitStore();

export type RateLimitOptions = {
  /** Unique key prefix, e.g. "api:auth" */
  prefix: string;
  /** Max requests in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
};

/**
 * Fixed-window rate limiter. Returns whether the request is allowed.
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = `${options.prefix}:${identifier}`;
  const now = Date.now();
  const existing = await store.get(key);

  if (!existing) {
    const resetAt = now + options.windowMs;
    await store.set(
      key,
      { count: 1, resetAt },
      options.windowMs,
    );

    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: resetAt,
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: existing.resetAt,
    };
  }

  const nextCount = existing.count + 1;
  await store.set(
    key,
    { count: nextCount, resetAt: existing.resetAt },
    existing.resetAt - now,
  );

  return {
    success: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - nextCount),
    reset: existing.resetAt,
  };
}

/** Sensible defaults for common surfaces */
export const RATE_LIMIT_PRESETS = {
  api: { prefix: "api", limit: 60, windowMs: 60_000 },
  auth: { prefix: "auth", limit: 10, windowMs: 60_000 },
  upload: { prefix: "upload", limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitOptions>;
