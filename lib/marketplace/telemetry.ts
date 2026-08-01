/**
 * Marketplace telemetry.
 */

import type { MarketplaceHealthCounters } from "@/lib/marketplace/types";

const counters: MarketplaceHealthCounters = {
  installed: 0,
  active: 0,
  authFailures: 0,
  syncFailures: 0,
  totalLatencyMs: 0,
  latencySamples: 0,
  byConnector: {},
  byVersion: {},
};

export function setMarketplaceInstallCounts(installed: number, active: number): void {
  counters.installed = installed;
  counters.active = active;
}

export function recordMarketplaceAuthFailure(): void {
  counters.authFailures += 1;
}

export function recordMarketplaceSyncFailure(): void {
  counters.syncFailures += 1;
}

export function recordMarketplaceLatency(ms: number): void {
  counters.totalLatencyMs += Math.max(0, ms);
  counters.latencySamples += 1;
}

export function recordMarketplaceInstall(connectorId: string, version: string): void {
  counters.byConnector[connectorId] =
    (counters.byConnector[connectorId] ?? 0) + 1;
  counters.byVersion[version] = (counters.byVersion[version] ?? 0) + 1;
}

export function getMarketplaceTelemetrySnapshot(): MarketplaceHealthCounters & {
  averageLatencyMs: number;
} {
  const averageLatencyMs =
    counters.latencySamples === 0
      ? 0
      : Math.round(counters.totalLatencyMs / counters.latencySamples);
  return {
    ...counters,
    byConnector: { ...counters.byConnector },
    byVersion: { ...counters.byVersion },
    averageLatencyMs,
  };
}

export function resetMarketplaceTelemetryForTests(): void {
  counters.installed = 0;
  counters.active = 0;
  counters.authFailures = 0;
  counters.syncFailures = 0;
  counters.totalLatencyMs = 0;
  counters.latencySamples = 0;
  counters.byConnector = {};
  counters.byVersion = {};
}
