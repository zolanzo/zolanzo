/**
 * Phase 4.5C — Integration Marketplace tests.
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
  INTEGRATION_MARKETPLACE_MODEL_VERSION,
  IntegrationMarketplaceService,
  IntegrationRegistry,
  STARTER_CONNECTORS,
  isIntegrationMarketplaceEnabled,
  resetConnectorHealthForTests,
  resetConnectorRegistryForTests,
  resetMarketplaceStoreForTests,
  resetMarketplaceTelemetryForTests,
} from "@/lib/marketplace";
import {
  resetWebhookStoreForTests,
  resetWebhookTelemetryForTests,
  clearSecretsForTests,
} from "@/lib/webhooks";

const ORIGINAL_ENV = { ...process.env };

function headers(init?: Record<string, string>): Headers {
  return new Headers(init);
}

beforeEach(() => {
  resetMarketplaceStoreForTests();
  resetMarketplaceTelemetryForTests();
  resetConnectorRegistryForTests();
  resetConnectorHealthForTests();
  resetWebhookStoreForTests();
  resetWebhookTelemetryForTests();
  clearSecretsForTests();
  resetApiKeyStoreForTests();
  resetIdempotencyStoreForTests();
  resetPublicApiTelemetryForTests();
  resetPublicApiAuditForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.PUBLIC_API;
  delete process.env.INTEGRATION_MARKETPLACE;
  delete process.env.CONNECTOR_RUNTIME;
  delete process.env.CONNECTOR_HEALTH;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Marketplace — manifests", () => {
  it("ships starter connectors across categories", () => {
    const list = IntegrationRegistry.list();
    expect(list.length).toBe(STARTER_CONNECTORS.length);
    expect(list.length).toBeGreaterThanOrEqual(7);
    const cats = new Set(list.map((c) => c.category));
    expect(cats.has("communication")).toBe(true);
    expect(cats.has("automation")).toBe(true);
    expect(cats.has("productivity")).toBe(true);
    for (const c of list) {
      expect(c.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(c.requiredScopes.length).toBeGreaterThan(0);
      expect(c.supportedApiEndpoints.every((e) => e.startsWith("/api/v1"))).toBe(
        true,
      );
    }
  });
});

describe("Marketplace — lifecycle", () => {
  it("install → configure → enable → disable → uninstall", async () => {
    const installed = IntegrationMarketplaceService.install({
      connectorId: "generic.webhook",
      organizationId: "ORG-1",
    });
    expect(installed.ok).toBe(true);
    if (!installed.ok) return;

    const configured = IntegrationMarketplaceService.configure(
      installed.installation.id,
      {
        endpointUrl: "https://hooks.example.com/z",
        eventTypes: "assignment.completed",
      },
    );
    expect(configured.ok).toBe(true);
    if (!configured.ok) return;
    expect(configured.installation.lifecycle).toBe("configured");
    expect(configured.installation.configVersion).toBeGreaterThan(1);

    const enabled = IntegrationMarketplaceService.enable(
      configured.installation.id,
    );
    expect(enabled.ok).toBe(true);
    if (!enabled.ok) return;
    expect(enabled.installation.enabled).toBe(true);
    expect(enabled.installation.lifecycle).toBe("enabled");

    const sync = await IntegrationMarketplaceService.sync(
      enabled.installation.id,
    );
    expect(sync.ok).toBe(true);
    if (!("usedPublicApi" in sync)) return;
    expect(sync.usedPublicApi.every((p) => p.startsWith("/api/v1"))).toBe(true);
    expect(sync.detail?.isolation).toBe("public_contracts_only");

    const disabled = IntegrationMarketplaceService.disable(
      enabled.installation.id,
    );
    expect(disabled.ok).toBe(true);

    expect(
      IntegrationMarketplaceService.uninstall(enabled.installation.id),
    ).toBe(true);
    expect(IntegrationMarketplaceService.listInstalled("ORG-1").length).toBe(0);
  });

  it("requires auth before enabling OAuth connectors", () => {
    const installed = IntegrationMarketplaceService.install({
      connectorId: "slack",
      organizationId: "ORG-1",
      config: { channel: "#ops" },
    });
    expect(installed.ok).toBe(true);
    if (!installed.ok) return;

    IntegrationMarketplaceService.configure(installed.installation.id, {
      channel: "#ops",
    });
    const early = IntegrationMarketplaceService.enable(
      installed.installation.id,
    );
    expect(early.ok).toBe(false);

    const auth = IntegrationMarketplaceService.authenticate(
      installed.installation.id,
      { kind: "oauth" },
    );
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    expect(auth.secret).toBeTruthy();

    const enabled = IntegrationMarketplaceService.enable(
      installed.installation.id,
    );
    expect(enabled.ok).toBe(true);
  });
});

describe("Marketplace — credentials & health", () => {
  it("rotates credentials", () => {
    const installed = IntegrationMarketplaceService.install({
      connectorId: "zapier",
      organizationId: "ORG-1",
      config: { zapHookUrl: "https://hooks.zapier.com/x" },
    });
    expect(installed.ok).toBe(true);
    if (!installed.ok) return;
    const auth = IntegrationMarketplaceService.authenticate(
      installed.installation.id,
      { kind: "api_key" },
    );
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    const rotated = IntegrationMarketplaceService.rotateCredentials(
      installed.installation.id,
    );
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;
    expect(rotated.secret).not.toBe(auth.secret);
  });

  it("probes connector health", () => {
    const installed = IntegrationMarketplaceService.install({
      connectorId: "n8n",
      organizationId: "ORG-1",
      config: { webhookUrl: "https://n8n.example/hook" },
    });
    expect(installed.ok).toBe(true);
    if (!installed.ok) return;
    IntegrationMarketplaceService.authenticate(installed.installation.id, {
      kind: "api_key",
    });
    IntegrationMarketplaceService.enable(installed.installation.id);
    const health = IntegrationMarketplaceService.health(
      installed.installation.id,
    );
    expect(health?.connectorId).toBe("n8n");
    expect(health?.version).toBe("1.0.0");
  });
});

describe("Marketplace — feature flags & API", () => {
  it("respects INTEGRATION_MARKETPLACE=0", () => {
    process.env.INTEGRATION_MARKETPLACE = "0";
    expect(isIntegrationMarketplaceEnabled()).toBe(false);
    expect(IntegrationMarketplaceService.listAvailable()).toEqual([]);
  });

  it("lists connectors via Public API", async () => {
    const { secret } = createApiKey({
      name: "mkt",
      organizationId: "ORG-1",
      scopes: [
        "integrations.read",
        "integrations.write",
        "integrations.manage",
      ],
    });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/integrations",
      headers: headers({ "X-Api-Key": secret }),
      query: new URLSearchParams(),
    });
    expect(res.status).toBe(200);
    const data = (res.body as { data: unknown[] }).data;
    expect(data.length).toBeGreaterThanOrEqual(7);
  });

  it("exposes model version", () => {
    expect(INTEGRATION_MARKETPLACE_MODEL_VERSION).toContain(
      "integration-marketplace",
    );
  });
});
