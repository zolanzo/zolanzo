/**
 * Feature configuration — flags catalog + evaluation defaults.
 */

import {
  FEATURE_FLAGS,
  FEATURE_FLAG_PLAN_GATES,
  SUBSCRIPTION_PLANS,
} from "@/constants/feature-flags";

export const FEATURE_CONFIG = {
  flags: FEATURE_FLAGS,
  planGates: FEATURE_FLAG_PLAN_GATES,
  plans: SUBSCRIPTION_PLANS,
  /** Defaults for seed / local — all off until enabled in DB or env */
  defaultEnabled: [] as readonly string[],
} as const;

export type FeatureConfig = typeof FEATURE_CONFIG;
