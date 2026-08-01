/**
 * Public API Gateway — auth → scopes → rate limit → idempotency → handler.
 */

import { randomBytes } from "node:crypto";
import {
  isPublicApiEnabled,
  isPublicApiV1Enabled,
} from "@/lib/public-api/config";
import { resolvePrincipalFromHeaders } from "@/lib/public-api/auth/resolve";
import {
  PublicApiError,
  successEnvelope,
  toPublicErrorEnvelope,
} from "@/lib/public-api/errors";
import { enforcePublicRateLimit } from "@/lib/public-api/rate-limit";
import {
  lookupIdempotentResponse,
  requireIdempotencyKey,
  storeIdempotentResponse,
} from "@/lib/public-api/idempotency";
import { recordPublicApiAudit } from "@/lib/public-api/audit";
import { recordPublicApiRequest } from "@/lib/public-api/telemetry";
import {
  assertRouteScopes,
  findRoute,
  type RouteDefinition,
} from "@/lib/public-api/routes/v1";
import type { PublicPrincipal } from "@/lib/public-api/types";
import { PUBLIC_API_SCOPES } from "@/lib/public-api/types";

export type GatewayResult = {
  status: number;
  body: unknown;
  headers: Record<string, string>;
};

function requestId(): string {
  return `req_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

function anonymousPublicPrincipal(): PublicPrincipal {
  return {
    id: "principal:anonymous",
    kind: "api_key",
    displayName: "anonymous",
    organizationId: null,
    scopes: [],
    userId: null,
    clientId: null,
    apiKeyId: null,
  };
}

function unwrapHandlerResult(result: unknown): {
  data: unknown;
  page?: { nextCursor: string | null; hasMore: boolean };
} {
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    "page" in result
  ) {
    const r = result as {
      data: unknown;
      page: { nextCursor: string | null; hasMore: boolean };
    };
    return { data: r.data, page: r.page };
  }
  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    !("page" in result) &&
    Object.keys(result as object).length === 1
  ) {
    return { data: (result as { data: unknown }).data };
  }
  return { data: result };
}

export async function handlePublicApiRequest(input: {
  method: string;
  path: string;
  headers: Headers;
  query: URLSearchParams;
  body?: unknown;
}): Promise<GatewayResult> {
  const started = Date.now();
  const rid = requestId();
  const headers: Record<string, string> = {
    "X-Request-Id": rid,
    "X-Api-Version": "v1",
  };

  try {
    if (!isPublicApiEnabled() || !isPublicApiV1Enabled()) {
      throw new PublicApiError(
        "FEATURE_DISABLED",
        "Public API is disabled",
        503,
      );
    }

    // Strip /api/v1 prefix if present
    let path = input.path;
    if (path.startsWith("/api/v1")) path = path.slice("/api/v1".length) || "/";
    if (!path.startsWith("/")) path = `/${path}`;

    const matched = findRoute(input.method, path);
    if (!matched) {
      throw new PublicApiError("NOT_FOUND", `No route for ${input.method} ${path}`, 404);
    }
    const route: RouteDefinition = matched.route;

    let principal: PublicPrincipal;
    if (route.public) {
      principal = anonymousPublicPrincipal();
      // OAuth token endpoint remains public; openapi too
    } else {
      principal = resolvePrincipalFromHeaders(input.headers);
      assertRouteScopes(route, principal);
      const rl = await enforcePublicRateLimit(principal);
      Object.assign(headers, rl);
    }

    const mutating = Boolean(route.mutating);
    const idemKey = mutating
      ? requireIdempotencyKey(input.headers, true)
      : null;

    if (idemKey && !route.public) {
      const cached = lookupIdempotentResponse({
        principalId: principal.id,
        method: route.method,
        path: route.path,
        key: idemKey,
      });
      if (cached) {
        recordPublicApiAudit({
          requestId: rid,
          principalId: principal.id,
          method: route.method,
          path: route.path,
          status: cached.status,
          scope: route.scopes[0] ?? null,
        });
        recordPublicApiRequest(Date.now() - started, cached.status < 400);
        return {
          status: cached.status,
          body: cached.body,
          headers: { ...headers, "X-Idempotency-Replay": "true" },
        };
      }
    }

    const raw = await route.handler({
      principal,
      params: matched.params,
      query: input.query,
      body: input.body,
      requestId: rid,
    });

    // OpenAPI returns document as body directly
    if (route.path === "/openapi.json") {
      recordPublicApiRequest(Date.now() - started, true);
      return { status: 200, body: raw, headers };
    }

    const unwrapped = unwrapHandlerResult(raw);
    const body = successEnvelope(unwrapped.data, rid, unwrapped.page);
    const status = 200;

    if (idemKey && !route.public) {
      storeIdempotentResponse({
        principalId: principal.id,
        method: route.method,
        path: route.path,
        key: idemKey,
        status,
        body,
      });
    }

    recordPublicApiAudit({
      requestId: rid,
      principalId: principal.id,
      method: route.method,
      path: route.path,
      status,
      scope: route.scopes[0] ?? null,
    });
    recordPublicApiRequest(Date.now() - started, true);
    return { status, body, headers };
  } catch (err) {
    const apiErr =
      err instanceof PublicApiError
        ? err
        : new PublicApiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
    const body = toPublicErrorEnvelope(apiErr, rid);
    if (apiErr.status === 429 && apiErr.details?.retryAfterSec) {
      headers["Retry-After"] = String(apiErr.details.retryAfterSec);
    }
    recordPublicApiRequest(Date.now() - started, false);
    return { status: apiErr.status, body, headers };
  }
}

/** Test helper — mint a principal with all scopes */
export function testPrincipal(
  overrides?: Partial<PublicPrincipal>,
): PublicPrincipal {
  return {
    id: "principal:test",
    kind: "api_key",
    displayName: "test",
    organizationId: "ORG-2026-000001",
    scopes: [...PUBLIC_API_SCOPES],
    userId: "user_test",
    clientId: null,
    apiKeyId: "apk_test",
    ...overrides,
  };
}
