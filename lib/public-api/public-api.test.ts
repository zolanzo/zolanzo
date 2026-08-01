/**
 * Phase 4.5A — Public API Platform tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createApiKey,
  createOAuthClient,
  generateOpenApiDocument,
  handlePublicApiRequest,
  isPublicApiEnabled,
  isPublicApiV1Enabled,
  issueClientCredentialsToken,
  PUBLIC_API_MODEL_VERSION,
  resetApiKeyStoreForTests,
  resetIdempotencyStoreForTests,
  resetOAuthStoreForTests,
  resetPatStoreForTests,
  resetPublicApiAuditForTests,
  resetPublicApiTelemetryForTests,
  resetPublicCatalogForTests,
  ScopeCatalog,
  V1_ROUTES,
} from "@/lib/public-api";
import { listPublicApiAudit } from "@/lib/public-api/audit";

const ORIGINAL_ENV = { ...process.env };

function headers(init?: Record<string, string>): Headers {
  return new Headers(init);
}

beforeEach(() => {
  resetApiKeyStoreForTests();
  resetOAuthStoreForTests();
  resetPatStoreForTests();
  resetIdempotencyStoreForTests();
  resetPublicApiTelemetryForTests();
  resetPublicApiAuditForTests();
  resetPublicCatalogForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.PUBLIC_API;
  delete process.env.PUBLIC_API_V1;
  delete process.env.PUBLIC_OPENAPI;
  delete process.env.PUBLIC_RATE_LIMITING;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Public API — feature flags", () => {
  it("defaults on", () => {
    expect(isPublicApiEnabled()).toBe(true);
    expect(isPublicApiV1Enabled()).toBe(true);
    expect(PUBLIC_API_MODEL_VERSION).toContain("public-api");
  });

  it("respects PUBLIC_API=0", async () => {
    process.env.PUBLIC_API = "0";
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/campaigns",
      headers: headers(),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(503);
  });
});

describe("Public API — authentication", () => {
  it("rejects missing auth", async () => {
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/campaigns",
      headers: headers(),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(401);
    expect((res.body as { error: { code: string } }).error.code).toBe(
      "UNAUTHORIZED",
    );
  });

  it("authenticates with API key", async () => {
    const { secret } = createApiKey({ name: "test" });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/campaigns",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(200);
    expect((res.body as { meta: { apiVersion: string } }).meta.apiVersion).toBe(
      "v1",
    );
  });

  it("authenticates with OAuth client credentials", async () => {
    const { client, clientSecret } = createOAuthClient({ name: "partner" });
    const token = issueClientCredentialsToken({
      clientId: client.clientId,
      clientSecret,
    });
    expect(token).toBeTruthy();
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/me",
      headers: headers({ Authorization: `Bearer ${token!.accessToken}` }),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(200);
  });
});

describe("Public API — authorization / scopes", () => {
  it("denies missing scopes", async () => {
    const { secret } = createApiKey({
      name: "limited",
      scopes: ["campaigns.read"],
    });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/trust/profiles/WRK-1",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(403);
    expect((res.body as { error: { code: string } }).error.code).toBe(
      "SCOPE_DENIED",
    );
  });

  it("exposes known scopes", () => {
    expect(ScopeCatalog.all.length).toBeGreaterThan(10);
    expect(ScopeCatalog.isKnown("campaigns.read")).toBe(true);
  });
});

describe("Public API — version routing & pagination", () => {
  it("routes v1 resources", async () => {
    const { secret } = createApiKey({ name: "full" });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/api/v1/workers",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams({ limit: "1" }),
    });
    expect(res.status).toBe(200);
    const body = res.body as {
      data: unknown[];
      page: { hasMore: boolean; nextCursor: string | null };
    };
    expect(body.data.length).toBe(1);
    expect(body.page.hasMore).toBe(true);
    expect(body.page.nextCursor).toBeTruthy();
  });

  it("returns 404 for unknown paths", async () => {
    const { secret } = createApiKey({ name: "full" });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/nope",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(404);
  });
});

describe("Public API — idempotency", () => {
  it("replays mutating responses", async () => {
    const { secret } = createApiKey({ name: "full" });
    const h = headers({
      "X-Api-Key": secret,
      "Idempotency-Key": "claim-1",
    });
    const first = await handlePublicApiRequest({
      method: "POST",
      path: "/assignments/ASN-2026-000001/claim",
      headers: h,
      query: new URLSearchParams(),
      body: { workerId: "WRK-2026-000001" },
    });
    expect(first.status).toBe(200);
    resetPublicCatalogForTests(); // would re-open claim but idempotency returns cached
    const second = await handlePublicApiRequest({
      method: "POST",
      path: "/assignments/ASN-2026-000001/claim",
      headers: h,
      query: new URLSearchParams(),
      body: { workerId: "WRK-2026-000001" },
    });
    expect(second.status).toBe(200);
    expect(second.headers["X-Idempotency-Replay"]).toBe("true");
  });

  it("requires Idempotency-Key on mutations", async () => {
    const { secret } = createApiKey({ name: "full" });
    const res = await handlePublicApiRequest({
      method: "POST",
      path: "/reports/generate",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
      body: { type: "executive" },
    });
    expect(res.status).toBe(400);
  });
});

describe("Public API — error model", () => {
  it("never leaks internal exception names", async () => {
    const { secret } = createApiKey({ name: "full" });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/campaigns/CMP-MISSING",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(404);
    const err = (res.body as { error: Record<string, unknown> }).error;
    expect(err.code).toBe("NOT_FOUND");
    expect(err.requestId).toBeTruthy();
    expect(err.documentation).toBe("/docs/api/errors");
    expect(JSON.stringify(err)).not.toContain("Prisma");
    expect(JSON.stringify(err)).not.toContain("AppError");
  });
});

describe("Public API — OpenAPI", () => {
  it("generates OpenAPI 3.1 with operationIds", () => {
    const doc = generateOpenApiDocument();
    expect(doc.openapi).toBe("3.1.0");
    expect(Object.keys(doc.paths).length).toBeGreaterThan(10);
    const campaign = doc.paths["/api/v1/campaigns"]?.get as {
      operationId: string;
      tags: string[];
    };
    expect(campaign.operationId).toBe("listCampaigns");
    expect(campaign.tags).toContain("Campaigns");
  });

  it("serves openapi.json publicly", async () => {
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/openapi.json",
      headers: headers(),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(200);
    expect((res.body as { openapi: string }).openapi).toBe("3.1.0");
  });
});

describe("Public API — audit & read-only trust", () => {
  it("records audit entries", async () => {
    const { secret } = createApiKey({ name: "full" });
    await handlePublicApiRequest({
      method: "GET",
      path: "/organizations",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(listPublicApiAudit().length).toBeGreaterThan(0);
  });

  it("returns advisory trust/forecast payloads", async () => {
    const { secret } = createApiKey({ name: "full" });
    const trust = await handlePublicApiRequest({
      method: "GET",
      path: "/trust/profiles/WRK-2026-000001",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(
      (trust.body as { data: { advisoryOnly: boolean } }).data.advisoryOnly,
    ).toBe(true);
    const forecast = await handlePublicApiRequest({
      method: "GET",
      path: "/forecasts/campaign",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    const data = (forecast.body as {
      data: { advisoryOnly: boolean; confidence: number; modelVersion: string };
    }).data;
    expect(data.advisoryOnly).toBe(true);
    expect(data.confidence).toBeGreaterThan(0);
    expect(data.modelVersion).toBeTruthy();
  });

  it("registers SDK-ready routes", () => {
    expect(V1_ROUTES.every((r) => r.operationId && r.tags.length)).toBe(true);
  });
});
