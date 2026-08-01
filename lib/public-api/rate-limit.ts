/**
 * Public API rate limiting — per principal, with minute + daily quota.
 */

import { rateLimit } from "@/lib/security/rate-limit";
import {
  isPublicRateLimitingEnabled,
  PUBLIC_API_DAILY_QUOTA,
  PUBLIC_API_RATE_LIMIT_PER_MINUTE,
} from "@/lib/public-api/config";
import { PublicApiError } from "@/lib/public-api/errors";
import { recordPublicApiRateLimited } from "@/lib/public-api/telemetry";
import type { PublicPrincipal } from "@/lib/public-api/types";

export type RateLimitHeaders = Record<string, string>;

export async function enforcePublicRateLimit(
  principal: PublicPrincipal,
): Promise<RateLimitHeaders> {
  if (!isPublicRateLimitingEnabled()) {
    return {
      "X-RateLimit-Limit": String(PUBLIC_API_RATE_LIMIT_PER_MINUTE),
      "X-RateLimit-Remaining": String(PUBLIC_API_RATE_LIMIT_PER_MINUTE),
    };
  }

  const [minute, daily] = await Promise.all([
    rateLimit(principal.id, {
      prefix: "public_api:minute",
      limit: PUBLIC_API_RATE_LIMIT_PER_MINUTE,
      windowMs: 60_000,
    }),
    rateLimit(principal.id, {
      prefix: "public_api:daily",
      limit: PUBLIC_API_DAILY_QUOTA,
      windowMs: 86_400_000,
    }),
  ]);

  const headers: RateLimitHeaders = {
    "X-RateLimit-Limit": String(minute.limit),
    "X-RateLimit-Remaining": String(minute.remaining),
    "X-RateLimit-Reset": String(Math.ceil(minute.reset / 1000)),
    "X-RateLimit-Daily-Limit": String(daily.limit),
    "X-RateLimit-Daily-Remaining": String(daily.remaining),
  };

  if (!minute.success || !daily.success) {
    recordPublicApiRateLimited();
    throw new PublicApiError(
      "RATE_LIMITED",
      "Rate limit exceeded",
      429,
      {
        retryAfterSec: Math.max(
          1,
          Math.ceil(((minute.success ? daily.reset : minute.reset) - Date.now()) / 1000),
        ),
      },
    );
  }

  return headers;
}
