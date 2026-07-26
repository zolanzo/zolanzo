/**
 * Operations Console enums — queues, commands, views, playbooks.
 */

export const OPERATIONAL_QUEUE_KEYS = [
  "review",
  "settlement",
  "withdrawal",
  "notification",
  "payment",
  "moderation",
] as const;

export type OperationalQueueKey = (typeof OPERATIONAL_QUEUE_KEYS)[number];

export const OPERATIONAL_VIEW_KEYS = [
  "platform_overview",
  "campaign_operations",
  "marketplace_operations",
  "review_operations",
  "settlement_operations",
  "withdrawal_operations",
  "notification_operations",
  "payment_operations",
  "user_trust_overview",
  "audit_overview",
] as const;

export type OperationalViewKey = (typeof OPERATIONAL_VIEW_KEYS)[number];

export const OPERATION_COMMAND_TYPES = [
  "retry",
  "requeue",
  "escalate",
  "approve",
  "reject",
  "cancel",
  "archive",
  "suspend",
  "resume",
  "unlock",
] as const;

export type OperationCommandType = (typeof OPERATION_COMMAND_TYPES)[number];

export const OPERATION_COMMAND_TARGETS = [
  "notification_job",
  "settlement",
  "withdrawal",
  "review_queue_item",
  "reservation",
  "campaign",
  "user",
  "payment_intent",
  "moderation_case",
] as const;

export type OperationCommandTarget =
  (typeof OPERATION_COMMAND_TARGETS)[number];

export const OPERATION_COMMAND_STATUSES = [
  "accepted",
  "applied",
  "rejected",
  "failed",
  "reversed",
] as const;

export type OperationCommandStatus =
  (typeof OPERATION_COMMAND_STATUSES)[number];

/** Ops platform roles (subset of Role + ops-specific). */
export const OPERATIONS_ROLES = [
  "super_admin",
  "admin",
  "operations",
  "finance",
  "support",
  "moderator",
  "reviewer",
  "auditor",
] as const;

export type OperationsRole = (typeof OPERATIONS_ROLES)[number];

export const OPERATIONS_ROLE_LABELS: Record<OperationsRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  operations: "Operations",
  finance: "Finance",
  support: "Support",
  moderator: "Moderator",
  reviewer: "Reviewer",
  auditor: "Read-only Auditor",
};

export const SLA_SEVERITIES = ["ok", "watch", "breach"] as const;

export type SlaSeverity = (typeof SLA_SEVERITIES)[number];

export const PLAYBOOK_KEYS = [
  "notification_failure",
  "withdrawal_failure",
  "payment_failure",
  "review_sla",
] as const;

export type PlaybookKey = (typeof PLAYBOOK_KEYS)[number];
