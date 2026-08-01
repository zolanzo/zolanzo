/**
 * RuleBuilderService — visual authoring API.
 * Always persists via AutomationService.createRule (no parallel execution).
 */

import { AutomationService } from "@/lib/automation/automation-service";
import type { AutomationRule } from "@/lib/automation/types";
import { getTemplate } from "@/lib/automation/library/template-registry";
import { RuleGenerator } from "@/lib/automation/library/rule-generator";
import {
  isAutomationBuilderEnabled,
  isAutomationImportExportEnabled,
  isAutomationSimulationEnabled,
} from "@/lib/automation/builder/config";
import { TriggerPicker } from "@/lib/automation/builder/trigger-picker";
import { ConditionBuilder } from "@/lib/automation/builder/condition-builder";
import { ActionBuilder } from "@/lib/automation/builder/action-builder";
import { RuleValidator } from "@/lib/automation/builder/rule-validator";
import { RulePreview } from "@/lib/automation/builder/rule-preview";
import { SimulationEngine } from "@/lib/automation/builder/simulation-engine";
import { RuleSerializer } from "@/lib/automation/builder/rule-serializer";
import {
  getBuilderTelemetrySnapshot,
  recordBuilderClone,
  recordBuilderRuleCreated,
} from "@/lib/automation/builder/telemetry";
import type {
  RuleDraft,
  SimulationInput,
  SimulationResult,
  BuilderValidationResult,
  RulePreviewModel,
} from "@/lib/automation/builder/types";
import { AUTOMATION_BUILDER_MODEL_VERSION } from "@/lib/automation/builder/types";

export type CreateFromBuilderResult = {
  ok: boolean;
  rule?: AutomationRule;
  validation?: BuilderValidationResult;
  preview?: RulePreviewModel;
  error?: string;
  buildTimeMs?: number;
};

export function createEmptyDraft(
  partial?: Partial<RuleDraft>,
): RuleDraft {
  return {
    name: "",
    description: "",
    trigger: null,
    conditions: null,
    actions: [],
    enabled: true,
    dryRun: false,
    priority: 100,
    organizationId: null,
    sourceTemplateId: null,
    builderVersion: AUTOMATION_BUILDER_MODEL_VERSION,
    permissions: [],
    ...partial,
  };
}

export function prefillFromTemplate(
  templateId: string,
  parameters?: Record<string, string | number | boolean>,
): { ok: boolean; draft?: RuleDraft; error?: string } {
  if (!isAutomationBuilderEnabled()) {
    return { ok: false, error: "AUTOMATION_BUILDER disabled" };
  }
  const template = getTemplate(templateId);
  if (!template) return { ok: false, error: `Unknown template: ${templateId}` };
  const generated = RuleGenerator.generate({ template, parameters });
  return {
    ok: true,
    draft: createEmptyDraft({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      conditions: generated.conditions ?? null,
      actions: generated.actions,
      enabled: template.enabledByDefault,
      priority: template.priority,
      sourceTemplateId: template.id,
      permissions: [...template.permissions],
    }),
  };
}

export function cloneRule(ruleId: string): {
  ok: boolean;
  draft?: RuleDraft;
  error?: string;
} {
  if (!isAutomationBuilderEnabled()) {
    return { ok: false, error: "AUTOMATION_BUILDER disabled" };
  }
  const rule = AutomationService.getRule(ruleId);
  if (!rule) return { ok: false, error: `Unknown rule: ${ruleId}` };
  recordBuilderClone();
  return {
    ok: true,
    draft: createEmptyDraft({
      name: `${rule.name} (copy)`,
      description: rule.description,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: false,
      dryRun: rule.dryRun,
      priority: rule.priority,
      organizationId: rule.organizationId ?? null,
    }),
  };
}

export function validateDraft(
  draft: RuleDraft,
  actorPermissions?: string[],
): BuilderValidationResult {
  return RuleValidator.validate(draft, { actorPermissions });
}

export function previewDraft(draft: RuleDraft): RulePreviewModel {
  return RulePreview.build(draft);
}

export function simulateDraft(input: SimulationInput): SimulationResult {
  return SimulationEngine.simulate(input);
}

export function createRuleFromDraft(
  draft: RuleDraft,
  options?: { actorPermissions?: string[]; buildStartedAt?: number },
): CreateFromBuilderResult {
  const started = options?.buildStartedAt ?? Date.now();
  if (!isAutomationBuilderEnabled()) {
    return { ok: false, error: "AUTOMATION_BUILDER disabled" };
  }

  const validation = RuleValidator.validate(draft, {
    actorPermissions: options?.actorPermissions,
  });
  const preview = RulePreview.build(draft);
  if (!validation.ok) {
    return {
      ok: false,
      validation,
      preview,
      error: validation.errors.map((e) => e.message).join("; "),
    };
  }

  const input = RuleSerializer.toCreateInput(draft);
  if (!input) {
    return { ok: false, validation, preview, error: "Incomplete draft" };
  }

  const rule = AutomationService.createRule(input);
  if (!rule) {
    return {
      ok: false,
      validation,
      preview,
      error: "AutomationService.createRule failed (engine/rules disabled?)",
    };
  }

  const buildTimeMs = Date.now() - started;
  recordBuilderRuleCreated(buildTimeMs);
  return { ok: true, rule, validation, preview, buildTimeMs };
}

export function exportDraft(draft: RuleDraft) {
  return RuleSerializer.exportJson(draft);
}

export function importDraft(json: string) {
  return RuleSerializer.importJson(json);
}

export function getBuilderHealth() {
  const telemetry = getBuilderTelemetrySnapshot();
  return {
    builderEnabled: isAutomationBuilderEnabled(),
    simulationEnabled: isAutomationSimulationEnabled(),
    importExportEnabled: isAutomationImportExportEnabled(),
    modelVersion: AUTOMATION_BUILDER_MODEL_VERSION,
    rulesCreated: telemetry.rulesCreated,
    simulationsRun: telemetry.simulationsRun,
    validationFailures: telemetry.validationFailures,
    imports: telemetry.imports,
    exports: telemetry.exports,
    clones: telemetry.clones,
    averageBuildTimeMs: telemetry.averageBuildTimeMs,
  };
}

export const RuleBuilderService = {
  emptyDraft: createEmptyDraft,
  prefillFromTemplate,
  clone: cloneRule,
  validate: validateDraft,
  preview: previewDraft,
  simulate: simulateDraft,
  create: createRuleFromDraft,
  exportJson: exportDraft,
  importJson: importDraft,
  health: getBuilderHealth,
  triggers: TriggerPicker,
  conditions: ConditionBuilder,
  actions: ActionBuilder,
};
