/**
 * Phase 4.5D — Developer Portal & SDK Platform tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createApiKey,
  handlePublicApiRequest,
  resetApiKeyStoreForTests,
  resetIdempotencyStoreForTests,
  resetPublicApiAuditForTests,
  resetPublicApiTelemetryForTests,
} from "@/lib/public-api";
import {
  APIExplorer,
  DeveloperPortalService,
  ExampleGenerator,
  PORTAL_SECTIONS,
  QuickStartGenerator,
  SDKGenerator,
  ChangelogService,
  isApiExplorerEnabled,
  isDeveloperPortalEnabled,
  isSdkGenerationEnabled,
  resetPortalTelemetryForTests,
} from "@/lib/developer-portal";
import { generateOpenApiDocument } from "@/lib/public-api/openapi/generator";

const ORIGINAL_ENV = { ...process.env };

function headers(init?: Record<string, string>): Headers {
  return new Headers(init);
}

beforeEach(() => {
  resetPortalTelemetryForTests();
  resetApiKeyStoreForTests();
  resetIdempotencyStoreForTests();
  resetPublicApiTelemetryForTests();
  resetPublicApiAuditForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.PUBLIC_API;
  delete process.env.DEVELOPER_PORTAL;
  delete process.env.SDK_GENERATION;
  delete process.env.API_EXPLORER;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Developer Portal — flags", () => {
  it("defaults on when PUBLIC_API is enabled", () => {
    expect(isDeveloperPortalEnabled()).toBe(true);
    expect(isSdkGenerationEnabled()).toBe(true);
    expect(isApiExplorerEnabled()).toBe(true);
  });

  it("respects DEVELOPER_PORTAL=0", () => {
    process.env.DEVELOPER_PORTAL = "0";
    expect(isDeveloperPortalEnabled()).toBe(false);
    expect(isSdkGenerationEnabled()).toBe(false);
    expect(isApiExplorerEnabled()).toBe(false);
  });

  it("respects SDK_GENERATION=0 and API_EXPLORER=0", () => {
    process.env.SDK_GENERATION = "0";
    process.env.API_EXPLORER = "0";
    expect(isSdkGenerationEnabled()).toBe(false);
    expect(isApiExplorerEnabled()).toBe(false);
    expect(isDeveloperPortalEnabled()).toBe(true);
  });
});

describe("Developer Portal — sections & coverage", () => {
  it("ships all required portal sections", () => {
    const home = DeveloperPortalService.home();
    expect(home.ok).toBe(true);
    if (!home.ok) return;
    expect(home.sections.map((s) => s.id).sort()).toEqual(
      [...PORTAL_SECTIONS].sort(),
    );
    expect(home.sections.length).toBe(PORTAL_SECTIONS.length);
  });

  it("reports full documentation coverage", () => {
    const health = DeveloperPortalService.health();
    expect(health.documentationCoverage).toBe(1);
    expect(health.brokenExamples).toBe(0);
  });
});

describe("SDKGenerator — from OpenAPI only", () => {
  it("generates TypeScript client methods from OpenAPI operationIds", () => {
    const doc = generateOpenApiDocument();
    const bundle = SDKGenerator.generate();
    expect("error" in bundle).toBe(false);
    if ("error" in bundle) return;
    expect(bundle.operationCount).toBeGreaterThan(10);
    const client = bundle.files.find((f) => f.path === "typescript/client.ts");
    expect(client).toBeTruthy();
    expect(client!.content).toContain("AUTO-GENERATED from OpenAPI");
    expect(client!.content).toContain("listCampaigns");
    expect(client!.content).toContain("generateDeveloperSdk");
    // Every OpenAPI operationId must appear as a method
    for (const [, methods] of Object.entries(doc.paths)) {
      for (const op of Object.values(methods)) {
        const o = op as { operationId?: string };
        if (o.operationId) {
          expect(client!.content).toContain(`async ${o.operationId}(`);
        }
      }
    }
  });
});

describe("APIExplorer — dry-run", () => {
  it("lists operations and previews curl + TypeScript", () => {
    const ops = APIExplorer.listOperations();
    expect(ops.length).toBeGreaterThan(10);
    const preview = APIExplorer.preview({
      operationId: "listCampaigns",
      query: { limit: "5" },
      apiKey: "zk_test",
    });
    expect("error" in preview).toBe(false);
    if ("error" in preview) return;
    expect(preview.dryRun).toBe(true);
    expect(preview.curl).toContain("curl -X GET");
    expect(preview.curl).toContain("X-Api-Key: zk_test");
    expect(preview.typescript).toContain("listCampaigns");
  });
});

describe("ExampleGenerator & QuickStart", () => {
  it("covers required example categories", () => {
    const examples = ExampleGenerator.generate();
    const cats = new Set(examples.map((e) => e.category));
    for (const c of [
      "Campaigns",
      "Assignments",
      "Trust",
      "Analytics",
      "Forecast",
      "Reports",
      "Automation",
      "Webhooks",
    ]) {
      expect(cats.has(c)).toBe(true);
    }
  });

  it("ships a multi-step quick start", () => {
    const steps = QuickStartGenerator.generate();
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps[0]!.title.toLowerCase()).toContain("api key");
  });

  it("lists changelog including portal release", () => {
    const entries = ChangelogService.list();
    expect(entries.some((e) => e.version === "v1.3.0")).toBe(true);
  });
});

describe("Developer Portal — Public API", () => {
  it("serves portal home via /api/v1/developer", async () => {
    const { secret } = createApiKey({
      name: "dev",
      organizationId: "ORG-1",
      scopes: ["developer.read", "developer.sdk", "developer.explorer"],
    });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/developer",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(200);
    const data = (res.body as { data: { apiVersion: string } }).data;
    expect(data.apiVersion).toBe("v1");
  });

  it("generates SDK via Public API", async () => {
    const { secret } = createApiKey({
      name: "sdk",
      organizationId: "ORG-1",
      scopes: ["developer.sdk"],
    });
    const res = await handlePublicApiRequest({
      method: "POST",
      path: "/developer/sdk/generate",
      headers: headers({
        "X-Api-Key": secret,
        "Idempotency-Key": "sdk-gen-1",
        "Content-Type": "application/json",
      }),
      query: new URLSearchParams(),
      body: {},
    });
    expect(res.status).toBe(200);
    const data = (
      res.body as { data: { operationCount: number; files: unknown[] } }
    ).data;
    expect(data.operationCount).toBeGreaterThan(10);
    expect(data.files.length).toBeGreaterThan(0);
  });

  it("previews explorer calls via Public API", async () => {
    const { secret } = createApiKey({
      name: "exp",
      organizationId: "ORG-1",
      scopes: ["developer.explorer"],
    });
    const res = await handlePublicApiRequest({
      method: "POST",
      path: "/developer/explorer/preview",
      headers: headers({
        "X-Api-Key": secret,
        "Idempotency-Key": "exp-1",
        "Content-Type": "application/json",
      }),
      query: new URLSearchParams(),
      body: { operationId: "getOpenApiJson" },
    });
    expect(res.status).toBe(200);
    const data = (res.body as { data: { dryRun: boolean; curl: string } }).data;
    expect(data.dryRun).toBe(true);
    expect(data.curl).toContain("openapi.json");
  });
});
