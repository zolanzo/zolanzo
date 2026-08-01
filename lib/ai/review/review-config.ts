/**
 * Review Assistant runtime flags.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch. Default: on (rule summaries always safe). */
export function isReviewAssistantEnabled(): boolean {
  if (falsy(process.env.AI_REVIEW_ASSISTANT)) return false;
  if (truthy(process.env.AI_REVIEW_ASSISTANT)) return true;
  return true;
}

/** Include executive summary bullets. Default: on. */
export function isReviewSummariesEnabled(): boolean {
  if (falsy(process.env.AI_REVIEW_SUMMARIES)) return false;
  if (truthy(process.env.AI_REVIEW_SUMMARIES)) return true;
  return true;
}

/** Accept reviewer feedback recording. Default: on. */
export function isReviewFeedbackEnabled(): boolean {
  if (falsy(process.env.AI_REVIEW_FEEDBACK)) return false;
  if (truthy(process.env.AI_REVIEW_FEEDBACK)) return true;
  return true;
}

/** Optional AI confidence polish when AI_ENABLED. */
export function shouldAugmentReviewWithAi(): boolean {
  const raw = process.env.AI_ENABLED?.trim().toLowerCase();
  const aiOn =
    raw === "1" || raw === "true" || raw === "on" || raw === "yes";
  return aiOn && isReviewAssistantEnabled();
}

export { REVIEW_ASSISTANT_MODEL_VERSION } from "@/lib/ai/review/review-types";
