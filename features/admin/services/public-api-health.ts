/**
 * Admin Public API Health — Phase 4.5A.
 */

import "server-only";

import {
  isPublicApiEnabled,
  isPublicApiV1Enabled,
  isPublicOpenApiEnabled,
  isPublicRateLimitingEnabled,
  PUBLIC_API_MODEL_VERSION,
} from "@/lib/public-api/config";
import { getPublicApiTelemetrySnapshot } from "@/lib/public-api/telemetry";
import { countActiveApiKeys } from "@/lib/public-api/auth/api-keys";
import { countActiveOAuthClients } from "@/lib/public-api/auth/oauth";

export type PublicApiHealthSnapshot = {
  publicApiEnabled: boolean;
  v1Enabled: boolean;
  openApiEnabled: boolean;
  rateLimitingEnabled: boolean;
  modelVersion: string;
  requestsPerMinute: number;
  errorRate: number;
  averageLatencyMs: number;
  rateLimitedRequests: number;
  oauthClients: number;
  apiKeys: number;
  scopeFailures: number;
  idempotencyHits: number;
  openApiGenerationStatus: "ready" | "disabled";
  openApiGenerations: number;
  generatedAt: string;
};

export async function getPublicApiHealthSnapshot(): Promise<PublicApiHealthSnapshot> {
  const telemetry = getPublicApiTelemetrySnapshot();
  return {
    publicApiEnabled: isPublicApiEnabled(),
    v1Enabled: isPublicApiV1Enabled(),
    openApiEnabled: isPublicOpenApiEnabled(),
    rateLimitingEnabled: isPublicRateLimitingEnabled(),
    modelVersion: PUBLIC_API_MODEL_VERSION,
    requestsPerMinute: telemetry.requestsPerMinuteEstimate,
    errorRate: telemetry.errorRate,
    averageLatencyMs: telemetry.averageLatencyMs,
    rateLimitedRequests: telemetry.rateLimited,
    oauthClients: countActiveOAuthClients() || telemetry.oauthClients,
    apiKeys: countActiveApiKeys() || telemetry.apiKeys,
    scopeFailures: telemetry.scopeFailures,
    idempotencyHits: telemetry.idempotencyHits,
    openApiGenerationStatus: isPublicOpenApiEnabled() ? "ready" : "disabled",
    openApiGenerations: telemetry.openapiGenerations,
    generatedAt: new Date().toISOString(),
  };
}
