/**
 * Admin Developer Portal Health — Phase 4.5D.
 */

import "server-only";

import { DeveloperPortalService } from "@/lib/developer-portal";

export type DeveloperPortalHealthSnapshot = {
  portalEnabled: boolean;
  sdkGenerationEnabled: boolean;
  apiExplorerEnabled: boolean;
  modelVersion: string;
  sdkGenerations: number;
  explorerPreviews: number;
  brokenExamples: number;
  openApiFreshnessMs: number | null;
  documentationCoverage: number;
  lastSdkAt: string | null;
  sectionCount: number;
  exampleCount: number;
  operationCount: number;
  generatedAt: string;
};

export async function getDeveloperPortalHealthSnapshot(): Promise<DeveloperPortalHealthSnapshot> {
  const health = DeveloperPortalService.health();
  return {
    portalEnabled: health.portalEnabled,
    sdkGenerationEnabled: health.sdkGenerationEnabled,
    apiExplorerEnabled: health.apiExplorerEnabled,
    modelVersion: health.modelVersion,
    sdkGenerations: health.sdkGenerations,
    explorerPreviews: health.explorerPreviews,
    brokenExamples: health.brokenExamples,
    openApiFreshnessMs: health.openApiFreshnessMs,
    documentationCoverage: health.documentationCoverage,
    lastSdkAt: health.lastSdkAt,
    sectionCount: health.sectionCount,
    exampleCount: health.exampleCount,
    operationCount: health.operationCount,
    generatedAt: new Date().toISOString(),
  };
}
