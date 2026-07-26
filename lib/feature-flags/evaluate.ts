/**
 * Feature flag evaluation contract — architecture only.
 */

import {
  FEATURE_FLAG_PLAN_GATES,
  planSatisfiesGate,
  type FeatureFlag,
  type SubscriptionPlan,
} from "@/constants/feature-flags";

export type FlagContext = {
  organizationId?: string;
  userId?: string;
  plan: SubscriptionPlan;
  /** Explicit overrides from remote config / DB */
  overrides?: Partial<Record<FeatureFlag, boolean>>;
};

export function isFeatureEnabled(
  flag: FeatureFlag,
  context: FlagContext,
): boolean {
  if (context.overrides && flag in context.overrides) {
    return Boolean(context.overrides[flag]);
  }
  const gate = FEATURE_FLAG_PLAN_GATES[flag];
  if (!gate) {
    return true;
  }
  return planSatisfiesGate(context.plan, gate);
}
