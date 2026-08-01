/**
 * Public API Platform — Phase 4.5A exports.
 */

export {
  PUBLIC_API_MODEL_VERSION,
  PUBLIC_API_VERSION,
  PUBLIC_API_SCOPES,
  type PublicApiScope,
  type PublicPrincipal,
  type PublicApiResponse,
} from "@/lib/public-api/types";

export {
  isPublicApiEnabled,
  isPublicApiV1Enabled,
  isPublicOpenApiEnabled,
  isPublicRateLimitingEnabled,
} from "@/lib/public-api/config";

export { handlePublicApiRequest, testPrincipal } from "@/lib/public-api/gateway";
export { V1_ROUTES, findRoute } from "@/lib/public-api/routes/v1";
export {
  generateOpenApiDocument,
  openApiToYaml,
} from "@/lib/public-api/openapi/generator";
export {
  createApiKey,
  revokeApiKey,
  listApiKeys,
  resetApiKeyStoreForTests,
} from "@/lib/public-api/auth/api-keys";
export {
  createOAuthClient,
  issueClientCredentialsToken,
  resetOAuthStoreForTests,
  countActiveOAuthClients,
} from "@/lib/public-api/auth/oauth";
export {
  createPersonalAccessToken,
  resetPatStoreForTests,
} from "@/lib/public-api/auth/pat";
export {
  getPublicApiTelemetrySnapshot,
  resetPublicApiTelemetryForTests,
} from "@/lib/public-api/telemetry";
export {
  listPublicApiAudit,
  resetPublicApiAuditForTests,
} from "@/lib/public-api/audit";
export { resetIdempotencyStoreForTests } from "@/lib/public-api/idempotency";
export { resetPublicCatalogForTests } from "@/lib/public-api/services/catalog";
export { PublicApiError } from "@/lib/public-api/errors";
export { ScopeCatalog } from "@/lib/public-api/scopes";
