/**
 * Review definition catalog for Task Templates.
 */

export const REVIEW_ACTIONS = [
  "approval",
  "rejection",
  "revision_request",
  "escalation",
  "sampling",
  "multi_review_future",
] as const;

export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export type ReviewRulesDefinition = {
  required: boolean;
  /** Allowed reviewer actions for this template */
  actions: ReviewAction[];
  /** 0–1 sampling rate when sampling is enabled */
  samplingRate?: number;
  /** Future: require N independent reviews */
  multiReviewCount?: number;
  escalateAfterHours?: number;
};

export function validateReviewRules(
  rules: ReviewRulesDefinition,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!rules.actions.length) {
    errors.push("Review rules must declare at least one action");
  }
  for (const action of rules.actions) {
    if (!(REVIEW_ACTIONS as readonly string[]).includes(action)) {
      errors.push(`Unknown review action: ${action}`);
    }
  }
  if (
    rules.samplingRate !== undefined &&
    (rules.samplingRate < 0 || rules.samplingRate > 1)
  ) {
    errors.push("samplingRate must be between 0 and 1");
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
