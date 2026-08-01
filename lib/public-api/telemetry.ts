/**
 * Public API telemetry.
 */

import type { PublicApiHealthCounters } from "@/lib/public-api/types";

const counters: PublicApiHealthCounters = {
  requests: 0,
  errors: 0,
  rateLimited: 0,
  scopeFailures: 0,
  idempotencyHits: 0,
  totalLatencyMs: 0,
  oauthClients: 0,
  apiKeys: 0,
  openapiGenerations: 0,
  lastRequestAt: null,
};

export function recordPublicApiRequest(latencyMs: number, ok: boolean): void {
  counters.requests += 1;
  counters.totalLatencyMs += Math.max(0, latencyMs);
  counters.lastRequestAt = new Date().toISOString();
  if (!ok) counters.errors += 1;
}

export function recordPublicApiRateLimited(): void {
  counters.rateLimited += 1;
}

export function recordPublicApiScopeFailure(): void {
  counters.scopeFailures += 1;
}

export function recordPublicApiIdempotencyHit(): void {
  counters.idempotencyHits += 1;
}

export function recordPublicOpenApiGeneration(): void {
  counters.openapiGenerations += 1;
}

export function setPublicApiCredentialCounts(counts: {
  apiKeys: number;
  oauthClients: number;
}): void {
  counters.apiKeys = counts.apiKeys;
  counters.oauthClients = counts.oauthClients;
}

export function getPublicApiTelemetrySnapshot(): PublicApiHealthCounters & {
  requestsPerMinuteEstimate: number;
  errorRate: number;
  averageLatencyMs: number;
} {
  const averageLatencyMs =
    counters.requests === 0
      ? 0
      : Math.round(counters.totalLatencyMs / counters.requests);
  const errorRate =
    counters.requests === 0
      ? 0
      : Math.round((counters.errors / counters.requests) * 1000) / 1000;
  return {
    ...counters,
    requestsPerMinuteEstimate: counters.requests, // process-lifetime; health panel labels clearly
    errorRate,
    averageLatencyMs,
  };
}

export function resetPublicApiTelemetryForTests(): void {
  counters.requests = 0;
  counters.errors = 0;
  counters.rateLimited = 0;
  counters.scopeFailures = 0;
  counters.idempotencyHits = 0;
  counters.totalLatencyMs = 0;
  counters.oauthClients = 0;
  counters.apiKeys = 0;
  counters.openapiGenerations = 0;
  counters.lastRequestAt = null;
}
