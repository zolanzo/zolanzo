/**
 * Feature flags & subscription gates.
 * Evaluate via lib/feature-flags (contract only).
 */

export const FEATURE_FLAGS = [
  // Campaign types
  "campaign.google_play_reviews",
  "campaign.app_store_reviews",
  "campaign.reddit",
  "campaign.custom_human",
  // Product surfaces
  "marketplace.v2",
  "messaging.realtime",
  "ai_labeling.studio",
  "voice_collection.studio",
  "analytics.advanced",
  "api.public_v1",
  "developer.portal",
  "white_label",
  "multi_currency",
  "multi_region_routing",
  // Trust
  "kyc.required_high_value",
  "disputes.v2",
  // Growth
  "referrals.enabled",
  "rewards.seasonal",
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export const SUBSCRIPTION_PLANS = [
  "free",
  "starter",
  "growth",
  "business",
  "enterprise",
] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

/**
 * Which flags require a minimum plan (gate).
 * Unlisted flags default to available when explicitly enabled.
 */
export const FEATURE_FLAG_PLAN_GATES: Partial<
  Record<FeatureFlag, SubscriptionPlan>
> = {
  "analytics.advanced": "growth",
  "api.public_v1": "business",
  "developer.portal": "business",
  "white_label": "enterprise",
  "multi_region_routing": "enterprise",
  "ai_labeling.studio": "growth",
  "voice_collection.studio": "growth",
  "messaging.realtime": "starter",
};

export const PLAN_RANK: Record<SubscriptionPlan, number> = {
  free: 0,
  starter: 10,
  growth: 20,
  business: 30,
  enterprise: 40,
};

export function planSatisfiesGate(
  plan: SubscriptionPlan,
  required: SubscriptionPlan,
): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}
