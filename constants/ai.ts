/**
 * AI Plugin Platform enums — provider-agnostic, recommendation-only.
 */

export const AI_PLUGIN_CAPABILITIES = [
  "evidence_quality",
  "fraud_detection",
  "duplicate_detection",
  "risk_scoring",
  "reviewer_assistance",
  "queue_routing",
  "moderation_assistance",
  "prompt_generation",
  "translation_assistance",
] as const;

export type AiPluginCapability = (typeof AI_PLUGIN_CAPABILITIES)[number];

export const AI_EXTENSION_POINTS = [
  "submission",
  "validation",
  "review",
  "settlement",
  "withdrawal",
  "notifications",
  "operations",
] as const;

export type AiExtensionPoint = (typeof AI_EXTENSION_POINTS)[number];

export const AI_ENTITY_TYPES = [
  "submission",
  "validation_report",
  "review_queue_item",
  "settlement",
  "withdrawal",
  "notification_intent",
  "operational_command",
  "user",
  "campaign",
] as const;

export type AiEntityType = (typeof AI_ENTITY_TYPES)[number];

export const AI_PLUGIN_KEYS = [
  "memory",
  "evidence_quality",
  "fraud_detection",
  "duplicate_detection",
  "risk_scoring",
  "reviewer_assistance",
  "queue_routing",
  "moderation_assistance",
  "translation_assistance",
  "prompt_generation",
] as const;

export type AiPluginKey = (typeof AI_PLUGIN_KEYS)[number];

export const AI_POLICY_MODES = [
  "disabled",
  "recommendation_only",
  "human_approval_required",
  "automatic",
] as const;

export type AiPolicyMode = (typeof AI_POLICY_MODES)[number];

export const AI_RECOMMENDATION_KINDS = [
  "approve",
  "reject",
  "revise",
  "escalate",
  "route",
  "score",
  "flag",
  "assist",
  "translate",
  "prompt",
  "noop",
] as const;

export type AiRecommendationKind = (typeof AI_RECOMMENDATION_KINDS)[number];

export const AI_EXECUTION_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "skipped",
] as const;

export type AiExecutionStatus = (typeof AI_EXECUTION_STATUSES)[number];

export const AI_DECISION_OUTCOMES = [
  "accepted",
  "modified",
  "rejected",
  "deferred",
] as const;

export type AiDecisionOutcome = (typeof AI_DECISION_OUTCOMES)[number];

export const AI_PLUGIN_HEALTH = [
  "healthy",
  "degraded",
  "unavailable",
  "stub",
] as const;

export type AiPluginHealth = (typeof AI_PLUGIN_HEALTH)[number];
