/**
 * Match Engine runtime flags (env) — orthogonal to product plan gates.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch for match engine product path. Default: on when unset (rule scoring). */
export function isMatchEngineEnabled(): boolean {
  if (falsy(process.env.AI_MATCH_ENGINE)) return false;
  if (truthy(process.env.AI_MATCH_ENGINE)) return true;
  // Default enabled — rule-based ranking always safe; AI augment gated separately
  return true;
}

/** Include human-readable reason deltas. Default: on. */
export function isMatchExplainabilityEnabled(): boolean {
  if (falsy(process.env.AI_EXPLAINABILITY)) return false;
  if (truthy(process.env.AI_EXPLAINABILITY)) return true;
  return true;
}

/** Apply fairness balancing. Default: on. */
export function isMatchFairnessEnabled(): boolean {
  if (falsy(process.env.AI_FAIRNESS)) return false;
  if (truthy(process.env.AI_FAIRNESS)) return true;
  return true;
}

/** Use AI confidence augment when global AI_ENABLED is on. */
export function shouldAugmentWithAiConfidence(): boolean {
  const raw = process.env.AI_ENABLED?.trim().toLowerCase();
  const aiOn =
    raw === "1" || raw === "true" || raw === "on" || raw === "yes";
  return aiOn && isMatchEngineEnabled();
}

export const MATCH_ENGINE_MODEL_VERSION = "match-engine/1.0.0";
