/**
 * RuleSerializer — JSON import/export with version metadata.
 * YAML intentionally deferred (optional).
 */

import type { CreateAutomationRuleInput } from "@/lib/automation/types";
import { isKnownTrigger } from "@/lib/automation/trigger-registry";
import {
  isAutomationImportExportEnabled,
} from "@/lib/automation/builder/config";
import {
  recordBuilderExport,
  recordBuilderImport,
} from "@/lib/automation/builder/telemetry";
import type {
  RuleDraft,
  SerializedRuleBundle,
} from "@/lib/automation/builder/types";
import { AUTOMATION_BUILDER_MODEL_VERSION } from "@/lib/automation/builder/types";

export function draftToCreateInput(
  draft: RuleDraft,
): CreateAutomationRuleInput | null {
  if (!draft.trigger || !isKnownTrigger(draft.trigger)) return null;
  if (!draft.actions?.length) return null;
  return {
    name: draft.name.trim(),
    description: draft.description ?? "",
    trigger: draft.trigger,
    conditions: draft.conditions,
    actions: draft.actions,
    enabled: draft.enabled ?? true,
    dryRun: draft.dryRun ?? false,
    priority: draft.priority ?? 100,
    organizationId: draft.organizationId ?? null,
  };
}

export function exportRuleJson(draft: RuleDraft): {
  ok: boolean;
  json?: string;
  error?: string;
} {
  if (!isAutomationImportExportEnabled()) {
    return { ok: false, error: "AUTOMATION_IMPORT_EXPORT disabled" };
  }
  const rule = draftToCreateInput(draft);
  if (!rule) {
    return { ok: false, error: "Draft incomplete — cannot export" };
  }
  const bundle: SerializedRuleBundle = {
    format: "zolanzo.automation.rule",
    version: AUTOMATION_BUILDER_MODEL_VERSION,
    exportedAt: new Date().toISOString(),
    rule: {
      ...rule,
      sourceTemplateId: draft.sourceTemplateId ?? null,
      permissions: draft.permissions,
    },
  };
  recordBuilderExport();
  return { ok: true, json: JSON.stringify(bundle, null, 2) };
}

export function importRuleJson(raw: string): {
  ok: boolean;
  draft?: RuleDraft;
  error?: string;
} {
  if (!isAutomationImportExportEnabled()) {
    return { ok: false, error: "AUTOMATION_IMPORT_EXPORT disabled" };
  }
  try {
    const parsed = JSON.parse(raw) as SerializedRuleBundle;
    if (parsed.format !== "zolanzo.automation.rule") {
      return { ok: false, error: "Unrecognized rule export format" };
    }
    if (!parsed.rule?.trigger || !parsed.rule?.actions?.length) {
      return { ok: false, error: "Export missing trigger or actions" };
    }
    if (!isKnownTrigger(parsed.rule.trigger)) {
      return { ok: false, error: `Unknown trigger: ${parsed.rule.trigger}` };
    }
    const draft: RuleDraft = {
      name: parsed.rule.name,
      description: parsed.rule.description,
      trigger: parsed.rule.trigger,
      conditions: parsed.rule.conditions ?? null,
      actions: parsed.rule.actions,
      enabled: parsed.rule.enabled,
      dryRun: parsed.rule.dryRun,
      priority: parsed.rule.priority,
      organizationId: parsed.rule.organizationId,
      sourceTemplateId: parsed.rule.sourceTemplateId ?? null,
      permissions: parsed.rule.permissions,
      builderVersion: parsed.version,
    };
    recordBuilderImport();
    return { ok: true, draft };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid JSON",
    };
  }
}

export const RuleSerializer = {
  toCreateInput: draftToCreateInput,
  exportJson: exportRuleJson,
  importJson: importRuleJson,
};
