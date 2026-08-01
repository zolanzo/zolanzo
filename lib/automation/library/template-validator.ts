/**
 * TemplateValidator — structural + version + registry checks.
 */

import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_TRIGGERS,
  CONDITION_OPERATORS,
  type ConditionAtom,
  type ConditionGroup,
} from "@/lib/automation/types";
import { isKnownCategory } from "@/lib/automation/library/category-registry";
import type {
  AutomationTemplate,
  TemplateParameter,
  TemplateValidationResult,
} from "@/lib/automation/library/types";
import { recordTemplateValidationFailure } from "@/lib/automation/library/telemetry";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const PLACEHOLDER_RE = /^\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}$/;

function isConditionGroup(value: unknown): value is ConditionGroup {
  if (!value || typeof value !== "object") return false;
  const g = value as ConditionGroup;
  return g.logic === "and" || g.logic === "or";
}

function validateConditionTree(
  node: ConditionAtom | ConditionGroup,
  paramKeys: Set<string>,
  errors: string[],
  path: string,
): void {
  if (isConditionGroup(node)) {
    if (!Array.isArray(node.conditions) || node.conditions.length === 0) {
      errors.push(`${path}: condition group must have at least one condition`);
      return;
    }
    node.conditions.forEach((child, i) =>
      validateConditionTree(child, paramKeys, errors, `${path}[${i}]`),
    );
    return;
  }
  if (!node.field || typeof node.field !== "string") {
    errors.push(`${path}: condition field is required`);
  }
  if (
    !(CONDITION_OPERATORS as readonly string[]).includes(node.op)
  ) {
    errors.push(`${path}: unknown operator ${String(node.op)}`);
  }
  if (typeof node.value === "string") {
    const m = PLACEHOLDER_RE.exec(node.value);
    if (m && !paramKeys.has(m[1]!)) {
      errors.push(`${path}: unknown parameter placeholder {{${m[1]}}}`);
    }
  }
}

function validateParameters(
  parameters: TemplateParameter[],
  errors: string[],
): void {
  const seen = new Set<string>();
  for (const p of parameters) {
    if (!p.key || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(p.key)) {
      errors.push(`Invalid parameter key: ${p.key}`);
      continue;
    }
    if (seen.has(p.key)) {
      errors.push(`Duplicate parameter key: ${p.key}`);
    }
    seen.add(p.key);
    if (p.type === "enum" && (!p.enumValues || p.enumValues.length === 0)) {
      errors.push(`Parameter ${p.key}: enum requires enumValues`);
    }
  }
}

/**
 * Validate a template definition (registry / install-time).
 */
export function validateTemplate(
  template: AutomationTemplate,
  options?: { compatibleWithEngineVersion?: string },
): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!template.id?.trim()) errors.push("Template id is required");
  if (!template.name?.trim()) errors.push("Template name is required");
  if (!template.description?.trim()) {
    warnings.push("Template description is empty");
  }
  if (!isKnownCategory(template.category)) {
    errors.push(`Unknown category: ${template.category}`);
  }
  if (!(AUTOMATION_TRIGGERS as readonly string[]).includes(template.trigger)) {
    errors.push(`Unknown trigger: ${template.trigger}`);
  }
  if (!SEMVER_RE.test(template.version)) {
    errors.push(`Version must be semver (got ${template.version})`);
  }
  if (!template.actions?.length) {
    errors.push("Template must declare at least one action");
  }
  if (!template.permissions?.length) {
    errors.push("Template must declare required permissions");
  }

  validateParameters(template.parameters ?? [], errors);
  const paramKeys = new Set((template.parameters ?? []).map((p) => p.key));

  if (template.conditions) {
    validateConditionTree(template.conditions, paramKeys, errors, "conditions");
  }

  for (const [i, action] of (template.actions ?? []).entries()) {
    if (!(AUTOMATION_ACTION_TYPES as readonly string[]).includes(action.type)) {
      errors.push(`actions[${i}]: unknown action type ${action.type}`);
    }
    if (action.params) {
      for (const [k, v] of Object.entries(action.params)) {
        if (typeof v === "string") {
          const m = PLACEHOLDER_RE.exec(v);
          if (m && !paramKeys.has(m[1]!)) {
            errors.push(
              `actions[${i}].params.${k}: unknown placeholder {{${m[1]}}}`,
            );
          }
        }
      }
    }
  }

  if (options?.compatibleWithEngineVersion) {
    const major = Number.parseInt(template.version.split(".")[0] ?? "0", 10);
    if (major > 1) {
      warnings.push(
        `Template major version ${major} may need engine upgrade (engine ${options.compatibleWithEngineVersion})`,
      );
    }
  }

  const ok = errors.length === 0;
  if (!ok) recordTemplateValidationFailure();
  return { ok, errors, warnings };
}

/**
 * Validate install-time parameter values against template schema.
 */
export function validateInstallParameters(
  template: AutomationTemplate,
  parameters: Record<string, string | number | boolean>,
): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const known = new Set(template.parameters.map((p) => p.key));

  for (const key of Object.keys(parameters)) {
    if (!known.has(key)) {
      errors.push(`Unknown parameter: ${key}`);
    }
  }

  for (const p of template.parameters) {
    const raw = parameters[p.key] ?? p.defaultValue;
    if (p.required && (raw === undefined || raw === null || raw === "")) {
      errors.push(`Missing required parameter: ${p.key}`);
      continue;
    }
    if (raw === undefined) continue;
    if (p.type === "number" && typeof raw !== "number") {
      errors.push(`Parameter ${p.key} must be a number`);
    }
    if (p.type === "boolean" && typeof raw !== "boolean") {
      errors.push(`Parameter ${p.key} must be a boolean`);
    }
    if (p.type === "string" && typeof raw !== "string") {
      errors.push(`Parameter ${p.key} must be a string`);
    }
    if (p.type === "enum") {
      if (typeof raw !== "string" || !p.enumValues?.includes(raw)) {
        errors.push(
          `Parameter ${p.key} must be one of: ${(p.enumValues ?? []).join(", ")}`,
        );
      }
    }
  }

  const ok = errors.length === 0;
  if (!ok) recordTemplateValidationFailure();
  return { ok, errors, warnings };
}

export const TemplateValidator = {
  validate: validateTemplate,
  validateParameters: validateInstallParameters,
};
