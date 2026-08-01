/**
 * RuleValidator — live validation for Visual Rule Builder drafts.
 */

import { isKnownTrigger } from "@/lib/automation/trigger-registry";
import {
  AUTOMATION_ACTION_TYPES,
  CONDITION_OPERATORS,
  type ConditionAtom,
  type ConditionGroup,
} from "@/lib/automation/types";
import {
  isAutomationBuilderEnabled,
  isAutomationSimulationEnabled,
} from "@/lib/automation/builder/config";
import { validateActionParams } from "@/lib/automation/builder/action-builder";
import { walkConditions } from "@/lib/automation/builder/condition-builder";
import { getTriggerCatalogEntry } from "@/lib/automation/builder/trigger-picker";
import {
  recordBuilderValidationFailure,
} from "@/lib/automation/builder/telemetry";
import type {
  BuilderValidationIssue,
  BuilderValidationResult,
  RuleDraft,
} from "@/lib/automation/builder/types";
import { AUTOMATION_BUILDER_MODEL_VERSION } from "@/lib/automation/builder/types";

function issue(
  code: BuilderValidationIssue["code"],
  severity: BuilderValidationIssue["severity"],
  path: string,
  message: string,
): BuilderValidationIssue {
  return { code, severity, path, message };
}

function validateConditionNode(
  node: ConditionAtom | ConditionGroup,
  path: string,
  errors: BuilderValidationIssue[],
): void {
  if ("logic" in node && (node.logic === "and" || node.logic === "or")) {
    if (!Array.isArray(node.conditions) || node.conditions.length === 0) {
      errors.push(
        issue(
          "invalid_tree",
          "error",
          path,
          "Condition group must contain at least one condition",
        ),
      );
      return;
    }
    node.conditions.forEach((child, i) =>
      validateConditionNode(child, `${path}[${i}]`, errors),
    );
    return;
  }
  const atom = node as ConditionAtom;
  if (!atom.field?.trim()) {
    errors.push(
      issue("invalid_condition", "error", path, "Condition field is required"),
    );
  }
  if (!(CONDITION_OPERATORS as readonly string[]).includes(atom.op)) {
    errors.push(
      issue(
        "invalid_operator",
        "error",
        path,
        `Unknown operator: ${String(atom.op)}`,
      ),
    );
  }
  if (atom.op !== "exists" && atom.value === undefined) {
    errors.push(
      issue(
        "missing_parameter",
        "warning",
        path,
        `Operator ${atom.op} usually expects a value`,
      ),
    );
  }
}

export function validateRuleDraft(
  draft: RuleDraft,
  options?: {
    actorPermissions?: string[];
    forSimulation?: boolean;
  },
): BuilderValidationResult {
  const errors: BuilderValidationIssue[] = [];
  const warnings: BuilderValidationIssue[] = [];

  if (!isAutomationBuilderEnabled()) {
    errors.push(
      issue(
        "feature_flag",
        "error",
        "flags",
        "AUTOMATION_BUILDER is disabled",
      ),
    );
  }
  if (options?.forSimulation && !isAutomationSimulationEnabled()) {
    errors.push(
      issue(
        "feature_flag",
        "error",
        "flags",
        "AUTOMATION_SIMULATION is disabled",
      ),
    );
  }

  if (!draft.name?.trim()) {
    errors.push(issue("empty_name", "error", "name", "Rule name is required"));
  }

  if (!draft.trigger) {
    errors.push(
      issue("unknown_trigger", "error", "trigger", "Trigger is required"),
    );
  } else if (!isKnownTrigger(draft.trigger)) {
    errors.push(
      issue(
        "unknown_trigger",
        "error",
        "trigger",
        `Unknown trigger: ${draft.trigger}`,
      ),
    );
  }

  if (!draft.actions?.length) {
    errors.push(
      issue("empty_actions", "error", "actions", "At least one action is required"),
    );
  }

  if (draft.conditions) {
    validateConditionNode(draft.conditions, "conditions", errors);
    walkConditions(draft.conditions, (atom, path) => {
      // already validated ops; keep for path coverage
      void atom;
      void path;
    });
  }

  for (const [i, action] of (draft.actions ?? []).entries()) {
    if (!(AUTOMATION_ACTION_TYPES as readonly string[]).includes(action.type)) {
      errors.push(
        issue(
          "unsupported_action",
          "error",
          `actions[${i}]`,
          `Unsupported action: ${action.type}`,
        ),
      );
      continue;
    }
    for (const msg of validateActionParams(action.type, action.params)) {
      const code = msg.startsWith("Missing")
        ? "missing_parameter"
        : "unsupported_action";
      errors.push(issue(code, "error", `actions[${i}]`, msg));
    }
  }

  if (draft.trigger && isKnownTrigger(draft.trigger)) {
    const entry = getTriggerCatalogEntry(draft.trigger);
    const required = new Set([
      ...(entry?.requiredPermissions ?? []),
      ...(draft.permissions ?? []),
    ]);
    for (const action of draft.actions ?? []) {
      // collect from action catalog via validate path above
      void action;
    }
    if (options?.actorPermissions) {
      const actor = new Set(options.actorPermissions);
      for (const perm of required) {
        if (!actor.has(perm) && !actor.has("*")) {
          errors.push(
            issue(
              "permission_mismatch",
              "error",
              "permissions",
              `Missing permission: ${perm}`,
            ),
          );
        }
      }
    }
  }

  const version = draft.builderVersion ?? AUTOMATION_BUILDER_MODEL_VERSION;
  if (version.startsWith("automation-builder/")) {
    const major = Number.parseInt(version.split("/")[1]?.split(".")[0] ?? "1", 10);
    if (major > 1) {
      warnings.push(
        issue(
          "version_incompatible",
          "warning",
          "builderVersion",
          `Draft major version ${major} may need builder upgrade`,
        ),
      );
    }
  } else if (version && version !== AUTOMATION_BUILDER_MODEL_VERSION) {
    warnings.push(
      issue(
        "version_incompatible",
        "warning",
        "builderVersion",
        `Unrecognized builder version: ${version}`,
      ),
    );
  }

  // Split warning-severity items that landed in errors array
  const realErrors = errors.filter((e) => e.severity === "error");
  const mixedWarnings = [
    ...warnings,
    ...errors.filter((e) => e.severity === "warning"),
  ];

  const ok = realErrors.length === 0;
  if (!ok) recordBuilderValidationFailure();
  return { ok, errors: realErrors, warnings: mixedWarnings };
}

export const RuleValidator = {
  validate: validateRuleDraft,
};
