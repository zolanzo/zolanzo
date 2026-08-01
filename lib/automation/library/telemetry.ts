/**
 * Automation Library telemetry.
 */

import type { LibraryHealthCounters } from "@/lib/automation/library/types";

const counters: LibraryHealthCounters = {
  installs: 0,
  uninstalls: 0,
  validationFailures: 0,
  generationFailures: 0,
  byTemplate: {},
  byCategory: {},
};

export function recordTemplateInstall(event: {
  templateId: string;
  category: string;
  success: boolean;
}): void {
  if (!event.success) {
    counters.generationFailures += 1;
    return;
  }
  counters.installs += 1;
  counters.byTemplate[event.templateId] =
    (counters.byTemplate[event.templateId] ?? 0) + 1;
  counters.byCategory[event.category] =
    (counters.byCategory[event.category] ?? 0) + 1;
}

export function recordTemplateUninstall(): void {
  counters.uninstalls += 1;
}

export function recordTemplateValidationFailure(): void {
  counters.validationFailures += 1;
}

export function getLibraryTelemetrySnapshot(): LibraryHealthCounters & {
  mostUsed: Array<{ templateId: string; count: number }>;
} {
  const mostUsed = Object.entries(counters.byTemplate)
    .map(([templateId, count]) => ({ templateId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return {
    ...counters,
    byTemplate: { ...counters.byTemplate },
    byCategory: { ...counters.byCategory },
    mostUsed,
  };
}

export function resetLibraryTelemetryForTests(): void {
  counters.installs = 0;
  counters.uninstalls = 0;
  counters.validationFailures = 0;
  counters.generationFailures = 0;
  counters.byTemplate = {};
  counters.byCategory = {};
}
