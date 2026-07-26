/**
 * API strategy constants — REST now, GraphQL future.
 */

export const API_VERSIONS = ["v1"] as const;
export type ApiVersion = (typeof API_VERSIONS)[number];

export const API_AUTH_MODES = [
  "session_cookie",
  "bearer_user_jwt",
  "api_key",
  "oauth_client",
] as const;

export const WEBHOOK_DELIVERY_STATUSES = [
  "queued",
  "delivered",
  "failed",
  "dead_letter",
] as const;

export const IDEMPOTENCY_HEADER = "Idempotency-Key" as const;

export const RATE_LIMIT_SCOPES = [
  "public",
  "authenticated",
  "api_key",
  "webhook_ingress",
  "auth",
  "upload",
] as const;
