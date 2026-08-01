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
  "developer.portal",
  "white_label",
  "multi_currency",
  "multi_region_routing",
  // AI Intelligence (Phase 4)
  "ai.intelligence",
  "ai.ranking",
  "ai.explainability",
  "ai.fairness",
  "ai.fraud",
  "ai.fraud_explainability",
  "ai.duplicate_analysis",
  "ai.geo_analysis",
  "ai.review_assistant",
  "ai.review_summaries",
  "ai.review_feedback",
  "ai.org_copilot",
  "ai.org_memory",
  "ai.org_recommendations",
  "ai.worker_copilot",
  "ai.worker_memory",
  "ai.worker_recommendations",
  // Trust & Reputation (Phase 4.2)
  "trust.engine",
  "trust.explainability",
  "trust.trends",
  "trust.passport",
  "trust.badges",
  "trust.timeline",
  // Business Intelligence (Phase 4.3)
  "analytics.engine",
  "analytics.snapshots",
  "analytics.reports",
  "analytics.dashboards",
  "analytics.executive_dashboard",
  "analytics.operations_dashboard",
  "analytics.forecast_engine",
  "analytics.forecast_recommendations",
  "analytics.forecast_models",
  "analytics.reports_engine",
  "analytics.report_exports",
  "analytics.report_schedules",
  // Workflow Automation (Phase 4.4)
  "automation.engine",
  "automation.rules",
  "automation.actions",
  "automation.library",
  "automation.templates",
  "automation.builder",
  "automation.simulation",
  "automation.import_export",
  "automation.governance",
  "automation.approvals",
  "automation.audit",
  "api.public",
  "api.public_v1",
  "api.openapi",
  "api.rate_limiting",
  "api.webhooks",
  "api.webhook_delivery",
  "api.webhook_replay",
  "api.integration_marketplace",
  "api.connector_runtime",
  "api.connector_health",
  "api.developer_portal",
  "api.sdk_generation",
  "api.api_explorer",
  // Trust gates
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
  "developer.portal": "business",
  "white_label": "enterprise",
  "multi_region_routing": "enterprise",
  "ai_labeling.studio": "growth",
  "voice_collection.studio": "growth",
  "messaging.realtime": "starter",
  "ai.intelligence": "growth",
  "ai.ranking": "growth",
  "ai.explainability": "growth",
  "ai.fairness": "growth",
  "ai.fraud": "business",
  "ai.fraud_explainability": "business",
  "ai.duplicate_analysis": "business",
  "ai.geo_analysis": "business",
  "ai.review_assistant": "business",
  "ai.review_summaries": "business",
  "ai.review_feedback": "business",
  "ai.org_copilot": "business",
  "ai.org_memory": "business",
  "ai.org_recommendations": "business",
  "ai.worker_copilot": "growth",
  "ai.worker_memory": "growth",
  "ai.worker_recommendations": "growth",
  "trust.engine": "growth",
  "trust.explainability": "growth",
  "trust.trends": "growth",
  "trust.passport": "growth",
  "trust.badges": "growth",
  "trust.timeline": "growth",
  "analytics.engine": "growth",
  "analytics.snapshots": "growth",
  "analytics.reports": "growth",
  "analytics.dashboards": "growth",
  "analytics.executive_dashboard": "growth",
  "analytics.operations_dashboard": "growth",
  "analytics.forecast_engine": "growth",
  "analytics.forecast_recommendations": "growth",
  "analytics.forecast_models": "growth",
  "analytics.reports_engine": "growth",
  "analytics.report_exports": "growth",
  "analytics.report_schedules": "growth",
  "automation.engine": "growth",
  "automation.rules": "growth",
  "automation.actions": "growth",
  "automation.library": "growth",
  "automation.templates": "growth",
  "automation.builder": "growth",
  "automation.simulation": "growth",
  "automation.import_export": "growth",
  "automation.governance": "business",
  "automation.approvals": "business",
  "automation.audit": "business",
  "api.public": "business",
  "api.public_v1": "business",
  "api.openapi": "business",
  "api.rate_limiting": "business",
  "api.webhooks": "business",
  "api.webhook_delivery": "business",
  "api.webhook_replay": "business",
  "api.integration_marketplace": "business",
  "api.connector_runtime": "business",
  "api.connector_health": "business",
  "api.developer_portal": "business",
  "api.sdk_generation": "business",
  "api.api_explorer": "business",
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
