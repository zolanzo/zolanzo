/**
 * Admin Integration Marketplace Health — Phase 4.5C.
 */

import "server-only";

import { IntegrationMarketplaceService } from "@/lib/marketplace/marketplace-service";

export type IntegrationMarketplaceHealthSnapshot = {
  marketplaceEnabled: boolean;
  runtimeEnabled: boolean;
  healthEnabled: boolean;
  modelVersion: string;
  catalogSize: number;
  installedConnectors: number;
  activeConnectors: number;
  authenticationFailures: number;
  syncFailures: number;
  averageLatencyMs: number;
  versionDistribution: Record<string, number>;
  byConnector: Record<string, number>;
  generatedAt: string;
};

export async function getIntegrationMarketplaceHealthSnapshot(): Promise<IntegrationMarketplaceHealthSnapshot> {
  const health = IntegrationMarketplaceService.marketplaceHealth();
  return {
    marketplaceEnabled: health.marketplaceEnabled,
    runtimeEnabled: health.runtimeEnabled,
    healthEnabled: health.healthEnabled,
    modelVersion: health.modelVersion,
    catalogSize: health.catalogSize,
    installedConnectors: health.installed,
    activeConnectors: health.active,
    authenticationFailures: health.authFailures,
    syncFailures: health.syncFailures,
    averageLatencyMs: health.averageLatencyMs,
    versionDistribution: health.byVersion,
    byConnector: health.byConnector,
    generatedAt: new Date().toISOString(),
  };
}
