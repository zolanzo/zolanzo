/**
 * Rate Limiter for Authentication, Public API, & OTP Endpoints
 * Protects against brute-force, account enumeration, and SMS flooding.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export const RATE_LIMIT_PRESETS = {
  auth: { limit: 10, windowSeconds: 60, windowMs: 60_000 },
  otp: { limit: 5, windowSeconds: 300, windowMs: 300_000 },
  strict: { limit: 3, windowSeconds: 600, windowMs: 600_000 },
};

export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetSeconds: number; resetTime: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetSeconds: windowSeconds, resetTime };
  }

  if (record.count >= limit) {
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetSeconds, resetTime: record.resetTime };
  }

  record.count += 1;
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
  return { allowed: true, remaining: limit - record.count, resetSeconds, resetTime: record.resetTime };
}

export interface RateLimitOptions {
  prefix?: string;
  limit: number;
  windowSeconds?: number;
  windowMs?: number;
}

export async function rateLimit(
  key: string,
  options: RateLimitOptions = RATE_LIMIT_PRESETS.auth
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  resetSeconds: number;
}> {
  const prefix = options.prefix || "rate_limit";
  const windowSeconds = options.windowSeconds || (options.windowMs ? Math.ceil(options.windowMs / 1000) : 60);
  const compositeKey = `${prefix}:${key}`;

  const result = checkRateLimit(compositeKey, options.limit, windowSeconds);

  return {
    success: result.allowed,
    limit: options.limit,
    remaining: result.remaining,
    reset: result.resetTime,
    resetSeconds: result.resetSeconds,
  };
}
