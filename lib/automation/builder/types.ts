/**
 * Visual Rule Builder — Phase 4.4C types.
 * Builder authors rules; AutomationService executes them.
 */

import type {
  AutomationActionSpec,
  AutomationTriggerType,
  ConditionGroup,
  CreateAutomationRuleInput,
} from "@/lib/automation/types";

export const AUTOMATION_BUILDER_MODEL_VERSION = "automation-builder/1.0.0";

export const BUILDER_TRIGGER_CATEGORIES = [
  "assignments",
  "reviews",
  "campaigns",
  "payments",
  "trust",
  "analytics",
  "forecasts",
  "reports",
  "organizations",
  "workers",
] as const;

export type BuilderTriggerCategory =
  (typeof BUILDER_TRIGGER_CATEGORIES)[number];

export type BuilderValidationIssue = {
  code:
    | "unknown_trigger"
    | "invalid_condition"
    | "missing_parameter"
    | "unsupported_action"
    | "permission_mismatch"
    | "feature_flag"
    | "version_incompatible"
    | "empty_actions"
    | "empty_name"
    | "invalid_operator"
    | "invalid_tree";
  severity: "error" | "warning";
  path: string;
  message: string;
};

export type BuilderValidationResult = {
  ok: boolean;
  errors: BuilderValidationIssue[];
  warnings: BuilderValidationIssue[];
};

export type RuleDraft = {
  name: string;
  description?: string;
  trigger: AutomationTriggerType | null;
  conditions: ConditionGroup | null;
  actions: AutomationActionSpec[];
  enabled?: boolean;
  dryRun?: boolean;
  priority?: number;
  organizationId?: string | null;
  /** Optional library template used as prefill source */
  sourceTemplateId?: string | null;
  /** Builder schema version for import/export */
  builderVersion?: string;
  permissions?: string[];
};

export type ActionParameterSchema = {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "enum" | "object";
  required?: boolean;
  defaultValue?: unknown;
  enumValues?: string[];
  description?: string;
};

export type ActionCatalogEntry = {
  type: string;
  label: string;
  description: string;
  parameters: ActionParameterSchema[];
  permissions: string[];
  /** Lightweight relative cost 1–5 */
  estimatedCost: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMs: number;
  };
  timeoutMs: number;
};

export type TriggerCatalogEntry = {
  type: AutomationTriggerType;
  name: string;
  description: string;
  category: BuilderTriggerCategory;
  payloadFields: string[];
  requiredPermissions: string[];
  compatibleTemplateIds: string[];
};

export type RulePreviewModel = {
  trigger: AutomationTriggerType | null;
  triggerDescription: string | null;
  conditionsSummary: string[];
  matchingTemplateId: string | null;
  matchingTemplateName: string | null;
  actions: Array<{
    type: string;
    label: string;
    params: Record<string, unknown>;
    estimatedCost: number;
  }>;
  permissionsRequired: string[];
  estimatedExecutionFlow: string[];
  dryRun: boolean;
};

export type SimulationInput = {
  draft: RuleDraft;
  samplePayload?: Record<string, unknown>;
};

export type SimulationResult = {
  ok: boolean;
  conditionsMatched: boolean;
  conditionDetails: Array<{ path: string; matched: boolean; detail: string }>;
  actionsWouldExecute: Array<{
    type: string;
    label: string;
    params: Record<string, unknown>;
  }>;
  warnings: string[];
  estimatedLatencyMs: number;
  dryRun: true;
  validation: BuilderValidationResult;
};

export type SerializedRuleBundle = {
  format: "zolanzo.automation.rule";
  version: string;
  exportedAt: string;
  rule: CreateAutomationRuleInput & {
    sourceTemplateId?: string | null;
    permissions?: string[];
  };
};

export type BuilderHealthCounters = {
  rulesCreated: number;
  simulationsRun: number;
  validationFailures: number;
  imports: number;
  exports: number;
  clones: number;
  totalBuildTimeMs: number;
  buildSamples: number;
};
