/**
 * ActionBuilder — catalog of Action Registry entries with param schemas.
 */

import {
  AUTOMATION_ACTION_TYPES,
  type AutomationActionSpec,
  type AutomationActionType,
} from "@/lib/automation/types";
import { AUTOMATION_ACTION_TIMEOUT_MS } from "@/lib/automation/config";
import type {
  ActionCatalogEntry,
  ActionParameterSchema,
} from "@/lib/automation/builder/types";

const CATALOG: Record<AutomationActionType, ActionCatalogEntry> = {
  send_notification: {
    type: "send_notification",
    label: "Send notification",
    description: "Emit a notification intent via the Notification Hub",
    parameters: [
      {
        key: "event",
        label: "Hub event",
        type: "string",
        required: true,
        defaultValue: "security.alert",
      },
    ],
    permissions: ["analytics.read"],
    estimatedCost: 2,
    retryPolicy: { maxAttempts: 3, backoffMs: 500 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
  generate_report: {
    type: "generate_report",
    label: "Generate report",
    description: "Generate a BI report via ReportService",
    parameters: [
      {
        key: "reportType",
        label: "Report type",
        type: "enum",
        required: true,
        enumValues: ["executive", "finance", "trust", "campaign", "operations"],
        defaultValue: "executive",
      },
      {
        key: "format",
        label: "Format",
        type: "enum",
        required: false,
        enumValues: ["json", "csv", "pdf", "xlsx"],
        defaultValue: "json",
      },
    ],
    permissions: ["analytics.admin"],
    estimatedCost: 4,
    retryPolicy: { maxAttempts: 2, backoffMs: 1000 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
  schedule_report: {
    type: "schedule_report",
    label: "Schedule report",
    description: "Schedule a recurring report via ScheduleService",
    parameters: [
      {
        key: "reportType",
        label: "Report type",
        type: "string",
        required: true,
        defaultValue: "executive",
      },
      {
        key: "frequency",
        label: "Frequency",
        type: "enum",
        required: true,
        enumValues: ["daily", "weekly", "monthly", "quarterly"],
        defaultValue: "weekly",
      },
      {
        key: "format",
        label: "Format",
        type: "enum",
        required: false,
        enumValues: ["json", "csv", "pdf", "xlsx"],
        defaultValue: "json",
      },
    ],
    permissions: ["analytics.admin"],
    estimatedCost: 3,
    retryPolicy: { maxAttempts: 2, backoffMs: 1000 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
  refresh_analytics_snapshot: {
    type: "refresh_analytics_snapshot",
    label: "Refresh analytics snapshot",
    description: "Request analytics rollup / snapshot refresh",
    parameters: [],
    permissions: ["analytics.admin"],
    estimatedCost: 3,
    retryPolicy: { maxAttempts: 2, backoffMs: 800 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
  request_forecast_refresh: {
    type: "request_forecast_refresh",
    label: "Request forecast refresh",
    description: "Request ForecastService.refresh",
    parameters: [
      {
        key: "forecastType",
        label: "Forecast type",
        type: "string",
        required: false,
        defaultValue: "campaign",
      },
    ],
    permissions: ["analytics.read"],
    estimatedCost: 3,
    retryPolicy: { maxAttempts: 2, backoffMs: 800 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
  recalculate_trust: {
    type: "recalculate_trust",
    label: "Recalculate trust",
    description: "Request TrustProfileService.recalculate",
    parameters: [],
    permissions: ["analytics.admin"],
    estimatedCost: 4,
    retryPolicy: { maxAttempts: 2, backoffMs: 1000 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
  create_review_task: {
    type: "create_review_task",
    label: "Create review task",
    description: "Signal a review queue item (advisory / queued)",
    parameters: [
      {
        key: "queue",
        label: "Queue",
        type: "string",
        required: false,
        defaultValue: "review",
      },
    ],
    permissions: ["analytics.admin"],
    estimatedCost: 2,
    retryPolicy: { maxAttempts: 3, backoffMs: 500 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
  escalate_operations: {
    type: "escalate_operations",
    label: "Escalate operations",
    description: "Signal an operations escalation (advisory)",
    parameters: [
      {
        key: "reason",
        label: "Reason",
        type: "string",
        required: false,
        defaultValue: "automation_rule",
      },
      {
        key: "queue",
        label: "Queue",
        type: "string",
        required: false,
        defaultValue: "operations",
      },
    ],
    permissions: ["analytics.admin"],
    estimatedCost: 2,
    retryPolicy: { maxAttempts: 3, backoffMs: 500 },
    timeoutMs: AUTOMATION_ACTION_TIMEOUT_MS,
  },
};

export function listActionCatalog(): ActionCatalogEntry[] {
  return AUTOMATION_ACTION_TYPES.map((t) => CATALOG[t]);
}

export function getActionCatalogEntry(
  type: string,
): ActionCatalogEntry | undefined {
  if (!(AUTOMATION_ACTION_TYPES as readonly string[]).includes(type)) {
    return undefined;
  }
  return CATALOG[type as AutomationActionType];
}

export function buildActionSpec(
  type: AutomationActionType,
  params?: Record<string, unknown>,
): AutomationActionSpec {
  const entry = CATALOG[type];
  const merged: Record<string, unknown> = {};
  for (const p of entry.parameters) {
    if (params && p.key in params) {
      merged[p.key] = params[p.key];
    } else if (p.defaultValue !== undefined) {
      merged[p.key] = p.defaultValue;
    }
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (!(k in merged)) merged[k] = v;
    }
  }
  return Object.keys(merged).length
    ? { type, params: merged }
    : { type };
}

export function validateActionParams(
  type: string,
  params: Record<string, unknown> | undefined,
): string[] {
  const entry = getActionCatalogEntry(type);
  if (!entry) return [`Unknown action: ${type}`];
  const errors: string[] = [];
  const p = params ?? {};
  for (const schema of entry.parameters) {
    const value = p[schema.key] ?? schema.defaultValue;
    if (schema.required && (value === undefined || value === null || value === "")) {
      errors.push(`Missing required parameter: ${schema.key}`);
      continue;
    }
    if (value === undefined) continue;
    errors.push(...typeCheckParam(schema, value));
  }
  return errors;
}

function typeCheckParam(
  schema: ActionParameterSchema,
  value: unknown,
): string[] {
  if (schema.type === "string" && typeof value !== "string") {
    return [`Parameter ${schema.key} must be a string`];
  }
  if (schema.type === "number" && typeof value !== "number") {
    return [`Parameter ${schema.key} must be a number`];
  }
  if (schema.type === "boolean" && typeof value !== "boolean") {
    return [`Parameter ${schema.key} must be a boolean`];
  }
  if (
    schema.type === "enum" &&
    (typeof value !== "string" || !schema.enumValues?.includes(value))
  ) {
    return [
      `Parameter ${schema.key} must be one of: ${(schema.enumValues ?? []).join(", ")}`,
    ];
  }
  return [];
}

export const ActionBuilder = {
  list: listActionCatalog,
  get: getActionCatalogEntry,
  build: buildActionSpec,
  validateParams: validateActionParams,
};
