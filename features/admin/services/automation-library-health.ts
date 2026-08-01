/**
 * Admin Automation Library Health — template catalog observability (4.4B).
 */

import "server-only";

import { getLibraryHealth } from "@/lib/automation/library/library-service";
import { getExecutionHistory } from "@/lib/automation/execution-log";
import { listInstalls } from "@/lib/automation/library/install-store";

export type AutomationLibraryHealthSnapshot = {
  libraryEnabled: boolean;
  templatesEnabled: boolean;
  modelVersion: string;
  installedTemplates: number;
  activeTemplates: number;
  catalogSize: number;
  categories: number;
  mostUsed: Array<{ templateId: string; count: number }>;
  failedTemplateExecutions: number;
  ruleExecutionFailures: number;
  validationFailures: number;
  generationFailures: number;
  templateVersions: Array<{
    templateId: string;
    version: string;
    category: string;
  }>;
  byCategory: Record<string, number>;
  installs: number;
  uninstalls: number;
  generatedAt: string;
};

export async function getAutomationLibraryHealthSnapshot(): Promise<AutomationLibraryHealthSnapshot> {
  const health = getLibraryHealth();
  const installs = listInstalls();
  const ruleIds = new Set(installs.map((i) => i.ruleId));
  const history = getExecutionHistory(500);
  const ruleExecutionFailures = history.filter(
    (h) =>
      ruleIds.has(h.ruleId) &&
      (h.status === "failed" || h.status === "dead_letter"),
  ).length;

  return {
    libraryEnabled: health.libraryEnabled,
    templatesEnabled: health.templatesEnabled,
    modelVersion: health.modelVersion,
    installedTemplates: health.installedTemplates,
    activeTemplates: health.activeTemplates,
    catalogSize: health.catalogSize,
    categories: health.categories,
    mostUsed: health.mostUsed,
    failedTemplateExecutions:
      health.failedTemplateExecutions + ruleExecutionFailures,
    ruleExecutionFailures,
    validationFailures: health.validationFailures,
    generationFailures: health.generationFailures,
    templateVersions: health.templateVersions,
    byCategory: health.byCategory,
    installs: health.installs,
    uninstalls: health.uninstalls,
    generatedAt: new Date().toISOString(),
  };
}
