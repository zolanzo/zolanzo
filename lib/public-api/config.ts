/**
 * Public API runtime flags — Phase 4.5A.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master public API switch. Default: on. */
export function isPublicApiEnabled(): boolean {
  if (falsy(process.env.PUBLIC_API)) return false;
  if (truthy(process.env.PUBLIC_API)) return true;
  return true;
}

/** v1 contract surface. Default: on when PUBLIC_API on. */
export function isPublicApiV1Enabled(): boolean {
  if (!isPublicApiEnabled()) return false;
  if (falsy(process.env.PUBLIC_API_V1)) return false;
  if (truthy(process.env.PUBLIC_API_V1)) return true;
  return true;
}

/** OpenAPI document generation. Default: on when v1 on. */
export function isPublicOpenApiEnabled(): boolean {
  if (!isPublicApiV1Enabled()) return false;
  if (falsy(process.env.PUBLIC_OPENAPI)) return false;
  if (truthy(process.env.PUBLIC_OPENAPI)) return true;
  return true;
}

/** Rate limiting. Default: on when PUBLIC_API on. */
export function isPublicRateLimitingEnabled(): boolean {
  if (!isPublicApiEnabled()) return false;
  if (falsy(process.env.PUBLIC_RATE_LIMITING)) return false;
  if (truthy(process.env.PUBLIC_RATE_LIMITING)) return true;
  return true;
}

export const PUBLIC_API_RATE_LIMIT_PER_MINUTE = (() => {
  const n = Number(process.env.PUBLIC_API_RATE_LIMIT_PER_MINUTE ?? "60");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
})();

export const PUBLIC_API_RATE_LIMIT_BURST = (() => {
  const n = Number(process.env.PUBLIC_API_RATE_LIMIT_BURST ?? "20");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
})();

export const PUBLIC_API_DAILY_QUOTA = (() => {
  const n = Number(process.env.PUBLIC_API_DAILY_QUOTA ?? "10000");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10_000;
})();

export { PUBLIC_API_MODEL_VERSION, PUBLIC_API_VERSION } from "@/lib/public-api/types";
