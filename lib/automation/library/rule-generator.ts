/**
 * RuleGenerator — materialize templates into CreateAutomationRuleInput.
 * Always installed via AutomationService.createRule (no parallel path).
 */

import type {
  AutomationActionSpec,
  ConditionAtom,
  ConditionGroup,
  CreateAutomationRuleInput,
} from "@/lib/automation/types";
import type { AutomationTemplate } from "@/lib/automation/library/types";

const PLACEHOLDER_RE = /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;

function resolveValue(
  value: unknown,
  params: Record<string, string | number | boolean>,
): unknown {
  if (typeof value !== "string") return value;
  const exact = /^\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}$/.exec(value);
  if (exact) {
    const key = exact[1]!;
    return key in params ? params[key] : value;
  }
  return value.replace(PLACEHOLDER_RE, (_, key: string) => {
    const v = params[key];
    return v == null ? `{{${key}}}` : String(v);
  });
}

function substituteConditions(
  group: ConditionGroup | null,
  params: Record<string, string | number | boolean>,
): ConditionGroup | null {
  if (!group) return null;
  return {
    logic: group.logic,
    conditions: group.conditions.map((node) => {
      if ("logic" in node && (node.logic === "and" || node.logic === "or")) {
        return substituteConditions(node, params)!;
      }
      const atom = node as ConditionAtom;
      return {
        ...atom,
        value: resolveValue(atom.value, params),
      };
    }),
  };
}

function substituteActions(
  actions: AutomationActionSpec[],
  params: Record<string, string | number | boolean>,
): AutomationActionSpec[] {
  return actions.map((action) => {
    if (!action.params) return { ...action };
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(action.params)) {
      next[k] = resolveValue(v, params);
    }
    return { type: action.type, params: next };
  });
}

export function resolveTemplateParameters(
  template: AutomationTemplate,
  overrides?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const resolved: Record<string, string | number | boolean> = {};
  for (const p of template.parameters) {
    if (overrides && p.key in overrides) {
      resolved[p.key] = overrides[p.key]!;
    } else if (p.defaultValue !== undefined) {
      resolved[p.key] = p.defaultValue;
    }
  }
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (!(k in resolved)) resolved[k] = v;
    }
  }
  return resolved;
}

export function generateRuleInput(params: {
  template: AutomationTemplate;
  parameters?: Record<string, string | number | boolean>;
  organizationId?: string | null;
  enabled?: boolean;
  dryRun?: boolean;
  nameOverride?: string;
}): CreateAutomationRuleInput {
  const resolved = resolveTemplateParameters(
    params.template,
    params.parameters,
  );
  return {
    name: params.nameOverride ?? `[Library] ${params.template.name}`,
    description: `${params.template.description} (template ${params.template.id}@${params.template.version})`,
    trigger: params.template.trigger,
    conditions: substituteConditions(params.template.conditions, resolved),
    actions: substituteActions(params.template.actions, resolved),
    enabled: params.enabled ?? params.template.enabledByDefault,
    dryRun: params.dryRun ?? false,
    priority: params.template.priority,
    organizationId: params.organizationId ?? null,
  };
}

export const RuleGenerator = {
  generate: generateRuleInput,
  resolveParameters: resolveTemplateParameters,
};
