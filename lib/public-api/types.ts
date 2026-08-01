/**
 * Public API Platform — Phase 4.5A types.
 * Contract layer only — internal DTOs never leak.
 */

export const PUBLIC_API_MODEL_VERSION = "public-api/1.0.0";
export const PUBLIC_API_VERSION = "v1" as const;

export const PUBLIC_API_SCOPES = [
  "profile.read",
  "organizations.read",
  "workers.read",
  "campaigns.read",
  "campaigns.write",
  "assignments.read",
  "assignments.claim",
  "reviews.read",
  "payments.read",
  "trust.read",
  "analytics.read",
  "forecast.read",
  "reports.read",
  "reports.generate",
  "reports.schedule",
  "automation.read",
  "automation.write",
  "automation.publish",
  "webhooks.read",
  "webhooks.write",
  "webhooks.replay",
  "integrations.read",
  "integrations.write",
  "integrations.manage",
  "developer.read",
  "developer.sdk",
  "developer.explorer",
] as const;

export type PublicApiScope = (typeof PUBLIC_API_SCOPES)[number];

export type PublicPrincipalKind = "api_key" | "oauth_client" | "pat" | "session";

export type PublicPrincipal = {
  id: string;
  kind: PublicPrincipalKind;
  displayName: string;
  organizationId: string | null;
  scopes: PublicApiScope[];
  userId: string | null;
  clientId: string | null;
  apiKeyId: string | null;
};

export type PublicPage = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type PublicSuccessEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    apiVersion: typeof PUBLIC_API_VERSION;
  };
  page?: PublicPage;
};

export type PublicErrorEnvelope = {
  error: {
    code: string;
    message: string;
    requestId: string;
    documentation: string;
    details?: Record<string, unknown>;
  };
};

export type PublicApiResponse<T> = PublicSuccessEnvelope<T> | PublicErrorEnvelope;

export type PublicApiHealthCounters = {
  requests: number;
  errors: number;
  rateLimited: number;
  scopeFailures: number;
  idempotencyHits: number;
  totalLatencyMs: number;
  oauthClients: number;
  apiKeys: number;
  openapiGenerations: number;
  lastRequestAt: string | null;
};
