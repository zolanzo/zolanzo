/**
 * Admin Rule Builder Health — visual authoring observability (4.4C).
 */

import "server-only";

import { getBuilderHealth } from "@/lib/automation/builder/builder-service";

export type RuleBuilderHealthSnapshot = {
  builderEnabled: boolean;
  simulationEnabled: boolean;
  importExportEnabled: boolean;
  modelVersion: string;
  rulesCreated: number;
  simulationsRun: number;
  validationFailures: number;
  imports: number;
  exports: number;
  clones: number;
  averageBuildTimeMs: number;
  generatedAt: string;
};

export async function getRuleBuilderHealthSnapshot(): Promise<RuleBuilderHealthSnapshot> {
  const health = getBuilderHealth();
  return {
    builderEnabled: health.builderEnabled,
    simulationEnabled: health.simulationEnabled,
    importExportEnabled: health.importExportEnabled,
    modelVersion: health.modelVersion,
    rulesCreated: health.rulesCreated,
    simulationsRun: health.simulationsRun,
    validationFailures: health.validationFailures,
    imports: health.imports,
    exports: health.exports,
    clones: health.clones,
    averageBuildTimeMs: health.averageBuildTimeMs,
    generatedAt: new Date().toISOString(),
  };
}
