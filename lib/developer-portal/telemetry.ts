/**
 * Developer Portal telemetry.
 */

import type { PortalHealthCounters } from "@/lib/developer-portal/types";

const counters: PortalHealthCounters = {
  sdkGenerations: 0,
  explorerPreviews: 0,
  explorerExecutions: 0,
  brokenExamples: 0,
  brokenDocLinks: 0,
  openApiFreshnessMs: null,
  documentationCoverage: 0,
  lastSdkAt: null,
};

export function recordSdkGeneration(): void {
  counters.sdkGenerations += 1;
  counters.lastSdkAt = new Date().toISOString();
}

export function recordExplorerPreview(): void {
  counters.explorerPreviews += 1;
}

export function recordExplorerExecution(): void {
  counters.explorerExecutions += 1;
}

export function setBrokenExamples(count: number): void {
  counters.brokenExamples = count;
}

export function setBrokenDocLinks(count: number): void {
  counters.brokenDocLinks = count;
}

export function setOpenApiFreshness(ms: number): void {
  counters.openApiFreshnessMs = ms;
}

export function setDocumentationCoverage(ratio: number): void {
  counters.documentationCoverage = Math.max(0, Math.min(1, ratio));
}

export function getPortalTelemetrySnapshot(): PortalHealthCounters {
  return { ...counters };
}

export function resetPortalTelemetryForTests(): void {
  counters.sdkGenerations = 0;
  counters.explorerPreviews = 0;
  counters.explorerExecutions = 0;
  counters.brokenExamples = 0;
  counters.brokenDocLinks = 0;
  counters.openApiFreshnessMs = null;
  counters.documentationCoverage = 0;
  counters.lastSdkAt = null;
}
