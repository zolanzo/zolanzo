/**
 * Organization Copilot runtime flags.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch. Default: on (rule templates always safe). */
export function isOrgCopilotEnabled(): boolean {
  if (falsy(process.env.AI_ORG_COPILOT)) return false;
  if (truthy(process.env.AI_ORG_COPILOT)) return true;
  return true;
}

/** Session-scoped conversation memory. Default: on. */
export function isOrgMemoryEnabled(): boolean {
  if (falsy(process.env.AI_ORG_MEMORY)) return false;
  if (truthy(process.env.AI_ORG_MEMORY)) return true;
  return true;
}

/** Include actionable recommendations. Default: on. */
export function isOrgRecommendationsEnabled(): boolean {
  if (falsy(process.env.AI_ORG_RECOMMENDATIONS)) return false;
  if (truthy(process.env.AI_ORG_RECOMMENDATIONS)) return true;
  return true;
}

/** Optional AI polish when AI_ENABLED. */
export function shouldAugmentOrgCopilotWithAi(): boolean {
  const raw = process.env.AI_ENABLED?.trim().toLowerCase();
  const aiOn =
    raw === "1" || raw === "true" || raw === "on" || raw === "yes";
  return aiOn && isOrgCopilotEnabled();
}

export { ORG_COPILOT_MODEL_VERSION } from "@/lib/ai/copilot/org-types";
