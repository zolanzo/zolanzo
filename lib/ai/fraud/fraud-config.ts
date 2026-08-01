/**
 * Fraud Detection runtime flags — incremental capability gates.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch. Default: on (rule engine always safe). */
export function isFraudDetectionEnabled(): boolean {
  if (falsy(process.env.AI_FRAUD_DETECTION)) return false;
  if (truthy(process.env.AI_FRAUD_DETECTION)) return true;
  return true;
}

/** Human-readable reasons. Default: on. */
export function isFraudExplainabilityEnabled(): boolean {
  if (falsy(process.env.AI_FRAUD_EXPLAINABILITY)) return false;
  if (truthy(process.env.AI_FRAUD_EXPLAINABILITY)) return true;
  return true;
}

/** Duplicate hash / cross-submission analysis. Default: on. */
export function isDuplicateAnalysisEnabled(): boolean {
  if (falsy(process.env.AI_DUPLICATE_ANALYSIS)) return false;
  if (truthy(process.env.AI_DUPLICATE_ANALYSIS)) return true;
  return true;
}

/** GPS / boundary / travel checks. Default: on. */
export function isGeoAnalysisEnabled(): boolean {
  if (falsy(process.env.AI_GEO_ANALYSIS)) return false;
  if (truthy(process.env.AI_GEO_ANALYSIS)) return true;
  return true;
}

/** AI enrichment when global AI_ENABLED is on. */
export function shouldRunAiRiskAnalyzer(): boolean {
  const raw = process.env.AI_ENABLED?.trim().toLowerCase();
  const aiOn =
    raw === "1" || raw === "true" || raw === "on" || raw === "yes";
  return aiOn && isFraudDetectionEnabled();
}

export { FRAUD_ENGINE_MODEL_VERSION } from "@/lib/ai/fraud/fraud-types";
