/**
 * AutomationLibraryService — install templates as standard automation rules.
 * Templates never execute outside AutomationService.
 */

import { AutomationService } from "@/lib/automation/automation-service";
import {
  isAutomationLibraryEnabled,
  isAutomationTemplatesEnabled,
} from "@/lib/automation/library/config";
import { CategoryRegistry } from "@/lib/automation/library/category-registry";
import { TemplateRegistry } from "@/lib/automation/library/template-registry";
import { TemplateValidator } from "@/lib/automation/library/template-validator";
import { RuleGenerator } from "@/lib/automation/library/rule-generator";
import {
  saveInstall,
  listInstalls,
  getInstall,
  removeInstall,
  setInstallActive,
  countInstalls,
} from "@/lib/automation/library/install-store";
import {
  recordTemplateInstall,
  recordTemplateUninstall,
  getLibraryTelemetrySnapshot,
} from "@/lib/automation/library/telemetry";
import type {
  AutomationLibraryCategory,
  AutomationTemplate,
  InstallTemplateInput,
  InstalledTemplateRecord,
  TemplateValidationResult,
} from "@/lib/automation/library/types";
import { AUTOMATION_LIBRARY_MODEL_VERSION } from "@/lib/automation/library/types";

export type InstallTemplateResult = {
  ok: boolean;
  install?: InstalledTemplateRecord;
  validation?: TemplateValidationResult;
  error?: string;
};

export function listLibraryCategories() {
  return CategoryRegistry.list();
}

export function listLibraryTemplates(filter?: {
  category?: AutomationLibraryCategory;
  enabledByDefault?: boolean;
}): AutomationTemplate[] {
  if (!isAutomationLibraryEnabled()) return [];
  return TemplateRegistry.list(filter);
}

export function getLibraryTemplate(id: string): AutomationTemplate | undefined {
  if (!isAutomationLibraryEnabled()) return undefined;
  return TemplateRegistry.get(id);
}

export function validateLibraryTemplate(
  template: AutomationTemplate,
): TemplateValidationResult {
  return TemplateValidator.validate(template, {
    compatibleWithEngineVersion: "1.0.0",
  });
}

export function installTemplate(
  input: InstallTemplateInput,
): InstallTemplateResult {
  if (!isAutomationLibraryEnabled()) {
    return { ok: false, error: "AUTOMATION_LIBRARY disabled" };
  }
  if (!isAutomationTemplatesEnabled()) {
    return { ok: false, error: "AUTOMATION_TEMPLATES disabled" };
  }

  const template = TemplateRegistry.get(input.templateId);
  if (!template) {
    return { ok: false, error: `Unknown template: ${input.templateId}` };
  }

  const structure = TemplateValidator.validate(template, {
    compatibleWithEngineVersion: "1.0.0",
  });
  if (!structure.ok) {
    recordTemplateInstall({
      templateId: template.id,
      category: template.category,
      success: false,
    });
    return { ok: false, validation: structure, error: structure.errors.join("; ") };
  }

  const resolved = RuleGenerator.resolveParameters(
    template,
    input.parameters,
  );
  const paramCheck = TemplateValidator.validateParameters(template, resolved);
  if (!paramCheck.ok) {
    recordTemplateInstall({
      templateId: template.id,
      category: template.category,
      success: false,
    });
    return {
      ok: false,
      validation: paramCheck,
      error: paramCheck.errors.join("; "),
    };
  }

  const ruleInput = RuleGenerator.generate({
    template,
    parameters: resolved,
    organizationId: input.organizationId,
    enabled: input.enabled ?? template.enabledByDefault,
    dryRun: input.dryRun ?? false,
    nameOverride: input.nameOverride,
  });

  const rule = AutomationService.createRule(ruleInput);
  if (!rule) {
    recordTemplateInstall({
      templateId: template.id,
      category: template.category,
      success: false,
    });
    return {
      ok: false,
      error: "AutomationService.createRule failed (engine/rules disabled?)",
    };
  }

  const install = saveInstall({
    templateId: template.id,
    templateVersion: template.version,
    ruleId: rule.id,
    rulePublicId: rule.publicId,
    organizationId: input.organizationId ?? null,
    parameters: resolved,
    active: rule.enabled,
  });

  recordTemplateInstall({
    templateId: template.id,
    category: template.category,
    success: true,
  });

  return { ok: true, install, validation: structure };
}

export function uninstallTemplate(installId: string): boolean {
  if (!isAutomationTemplatesEnabled()) return false;
  const existing = getInstall(installId);
  if (!existing) return false;
  AutomationService.enableRule(existing.ruleId, false);
  const removed = removeInstall(installId);
  if (removed) recordTemplateUninstall();
  return removed;
}

export function setInstalledTemplateActive(
  installId: string,
  active: boolean,
): InstalledTemplateRecord | null {
  if (!isAutomationTemplatesEnabled()) return null;
  const existing = getInstall(installId);
  if (!existing) return null;
  AutomationService.enableRule(existing.ruleId, active);
  return setInstallActive(installId, active);
}

export function listInstalledTemplates(filter?: {
  organizationId?: string | null;
  templateId?: string;
  active?: boolean;
}): InstalledTemplateRecord[] {
  if (!isAutomationLibraryEnabled()) return [];
  return listInstalls(filter);
}

export function getLibraryHealth() {
  const telemetry = getLibraryTelemetrySnapshot();
  const installs = listInstalls();
  const versions = TemplateRegistry.versions();
  return {
    libraryEnabled: isAutomationLibraryEnabled(),
    templatesEnabled: isAutomationTemplatesEnabled(),
    modelVersion: AUTOMATION_LIBRARY_MODEL_VERSION,
    installedTemplates: installs.length,
    activeTemplates: countInstalls(true),
    catalogSize: TemplateRegistry.count(),
    categories: CategoryRegistry.list().length,
    mostUsed: telemetry.mostUsed,
    failedTemplateExecutions:
      telemetry.validationFailures + telemetry.generationFailures,
    validationFailures: telemetry.validationFailures,
    generationFailures: telemetry.generationFailures,
    templateVersions: versions,
    byCategory: telemetry.byCategory,
    uninstalls: telemetry.uninstalls,
    installs: telemetry.installs,
  };
}

export const AutomationLibraryService = {
  listCategories: listLibraryCategories,
  listTemplates: listLibraryTemplates,
  getTemplate: getLibraryTemplate,
  validateTemplate: validateLibraryTemplate,
  install: installTemplate,
  uninstall: uninstallTemplate,
  setActive: setInstalledTemplateActive,
  listInstalled: listInstalledTemplates,
  health: getLibraryHealth,
};
