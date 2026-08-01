/**
 * Trust Engine runtime flags.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch. Default: on. */
export function isTrustEngineEnabled(): boolean {
  if (falsy(process.env.TRUST_ENGINE)) return false;
  if (truthy(process.env.TRUST_ENGINE)) return true;
  return true;
}

/** Human-readable reasons. Default: on. */
export function isTrustExplainabilityEnabled(): boolean {
  if (falsy(process.env.TRUST_EXPLAINABILITY)) return false;
  if (truthy(process.env.TRUST_EXPLAINABILITY)) return true;
  return true;
}

/** Trend analysis. Default: on. */
export function isTrustTrendsEnabled(): boolean {
  if (falsy(process.env.TRUST_TRENDS)) return false;
  if (truthy(process.env.TRUST_TRENDS)) return true;
  return true;
}

/** Half-life in days for event time decay. */
export function getTrustDecayHalfLifeDays(): number {
  const raw = Number(process.env.TRUST_DECAY_HALF_LIFE_DAYS ?? "90");
  if (!Number.isFinite(raw) || raw <= 0) return 90;
  return raw;
}

export { TRUST_ENGINE_MODEL_VERSION } from "@/lib/trust/types";
