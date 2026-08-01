/**
 * Workflow Automation Foundation — Phase 4.4A types.
 * Automation never bypasses domain services or mutates DB directly.
 */

export const AUTOMATION_ENGINE_MODEL_VERSION = "automation-engine/1.0.0";

export const AUTOMATION_TRIGGERS = [
  "worker.registered",
  "campaign.created",
  "assignment.accepted",
  "assignment.completed",
  "submission.approved",
  "submission.rejected",
  "payment.settled",
  "trust.updated",
  "forecast.generated",
  "report.generated",
] as const;

export type AutomationTriggerType = (typeof AUTOMATION_TRIGGERS)[number];

export const AUTOMATION_ACTION_TYPES = [
  "send_notification",
  "generate_report",
  "schedule_report",
  "refresh_analytics_snapshot",
  "request_forecast_refresh",
  "recalculate_trust",
  "create_review_task",
  "escalate_operations",
] as const;

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export const CONDITION_OPERATORS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "contains",
  "exists",
] as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export type ConditionAtom = {
  field: string;
  op: ConditionOperator;
  value?: unknown;
};

export type ConditionGroup = {
  logic: "and" | "or";
  conditions: Array<ConditionAtom | ConditionGroup>;
};

export type AutomationActionSpec = {
  type: AutomationActionType;
  params?: Record<string, unknown>;
};

export type AutomationRule = {
  id: string;
  publicId: string;
  name: string;
  description: string;
  trigger: AutomationTriggerType;
  conditions: ConditionGroup | null;
  actions: AutomationActionSpec[];
  enabled: boolean;
  dryRun: boolean;
  priority: number;
  version: number;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AutomationEvent = {
  id: string;
  trigger: AutomationTriggerType;
  payload: Record<string, unknown>;
  organizationId?: string | null;
  campaignId?: string | null;
  userId?: string | null;
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
};

export type ActionExecutionResult = {
  actionType: AutomationActionType;
  ok: boolean;
  dryRun: boolean;
  message: string;
  durationMs: number;
  detail?: Record<string, unknown>;
};

export type AutomationExecutionStatus =
  | "success"
  | "skipped"
  | "failed"
  | "partial"
  | "dead_letter"
  | "dry_run";

export type AutomationExecutionRecord = {
  id: string;
  publicId: string;
  ruleId: string;
  rulePublicId: string;
  ruleVersion: number;
  trigger: AutomationTriggerType;
  eventId: string;
  correlationId: string;
  idempotencyKey: string;
  status: AutomationExecutionStatus;
  dryRun: boolean;
  attempt: number;
  actionResults: ActionExecutionResult[];
  errorMessage: string | null;
  latencyMs: number;
  createdAt: string;
};

export type AutomationDeadLetter = {
  id: string;
  executionId: string;
  ruleId: string;
  trigger: AutomationTriggerType;
  idempotencyKey: string;
  errorMessage: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CreateAutomationRuleInput = {
  name: string;
  description?: string;
  trigger: AutomationTriggerType;
  conditions?: ConditionGroup | null;
  actions: AutomationActionSpec[];
  enabled?: boolean;
  dryRun?: boolean;
  priority?: number;
  organizationId?: string | null;
};

export type AutomationHealthCounters = {
  executions: number;
  successes: number;
  failures: number;
  retries: number;
  dryRuns: number;
  deadLetters: number;
  totalLatencyMs: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  byTrigger: Record<string, number>;
};
