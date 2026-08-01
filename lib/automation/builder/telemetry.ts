/**
 * Visual Rule Builder telemetry.
 */

import type { BuilderHealthCounters } from "@/lib/automation/builder/types";

const counters: BuilderHealthCounters = {
  rulesCreated: 0,
  simulationsRun: 0,
  validationFailures: 0,
  imports: 0,
  exports: 0,
  clones: 0,
  totalBuildTimeMs: 0,
  buildSamples: 0,
};

export function recordBuilderRuleCreated(buildTimeMs: number): void {
  counters.rulesCreated += 1;
  counters.totalBuildTimeMs += Math.max(0, buildTimeMs);
  counters.buildSamples += 1;
}

export function recordBuilderSimulation(): void {
  counters.simulationsRun += 1;
}

export function recordBuilderValidationFailure(): void {
  counters.validationFailures += 1;
}

export function recordBuilderImport(): void {
  counters.imports += 1;
}

export function recordBuilderExport(): void {
  counters.exports += 1;
}

export function recordBuilderClone(): void {
  counters.clones += 1;
}

export function getBuilderTelemetrySnapshot(): BuilderHealthCounters & {
  averageBuildTimeMs: number;
} {
  const averageBuildTimeMs =
    counters.buildSamples === 0
      ? 0
      : Math.round(counters.totalBuildTimeMs / counters.buildSamples);
  return { ...counters, averageBuildTimeMs };
}

export function resetBuilderTelemetryForTests(): void {
  counters.rulesCreated = 0;
  counters.simulationsRun = 0;
  counters.validationFailures = 0;
  counters.imports = 0;
  counters.exports = 0;
  counters.clones = 0;
  counters.totalBuildTimeMs = 0;
  counters.buildSamples = 0;
}
