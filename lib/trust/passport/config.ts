/**
 * Trust Passport feature flags.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master passport switch. Default: on. */
export function isTrustPassportEnabled(): boolean {
  if (falsy(process.env.TRUST_PASSPORT)) return false;
  if (truthy(process.env.TRUST_PASSPORT)) return true;
  return true;
}

/** Badge section. Default: on. */
export function isTrustBadgesEnabled(): boolean {
  if (falsy(process.env.TRUST_BADGES)) return false;
  if (truthy(process.env.TRUST_BADGES)) return true;
  return true;
}

/** Timeline section. Default: on. */
export function isTrustTimelineEnabled(): boolean {
  if (falsy(process.env.TRUST_TIMELINE)) return false;
  if (truthy(process.env.TRUST_TIMELINE)) return true;
  return true;
}

export { TRUST_PASSPORT_MODEL_VERSION } from "@/lib/trust/passport/types";
