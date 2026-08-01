/**
 * Phase 4.5B — Webhooks & Event Subscriptions tests.
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
  DeliveryScheduler,
  FilterEngine,
  SignatureService,
  WEBHOOK_EVENT_TYPES,
  WEBHOOK_MODEL_VERSION,
  WebhookService,
  clearSecretsForTests,
  isPublicWebhooksEnabled,
  resetWebhookStoreForTests,
  resetWebhookTelemetryForTests,
} from "@/lib/webhooks";

const ORIGINAL_ENV = { ...process.env };

function headers(init?: Record<string, string>): Headers {
  return new Headers(init);
}

beforeEach(() => {
  resetWebhookStoreForTests();
  resetWebhookTelemetryForTests();
  clearSecretsForTests();
  DeliveryScheduler.resetTransport();
  resetApiKeyStoreForTests();
  resetIdempotencyStoreForTests();
  resetPublicApiTelemetryForTests();
  resetPublicApiAuditForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.PUBLIC_API;
  delete process.env.PUBLIC_WEBHOOKS;
  delete process.env.WEBHOOK_DELIVERY;
  delete process.env.WEBHOOK_REPLAY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  DeliveryScheduler.resetTransport();
});

describe("Webhooks — subscription CRUD", () => {
  it("creates, lists, updates, deletes", () => {
    const created = WebhookService.createSubscription({
      organizationId: "ORG-1",
      endpointUrl: "https://example.com/hooks",
      eventTypes: ["assignment.completed", "payment.completed"],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.subscription.secret).toMatch(/^whsec_/);
    expect(WebhookService.listSubscriptions("ORG-1").length).toBe(1);

    const updated = WebhookService.updateSubscription(created.subscription.id, {
      enabled: false,
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.subscription.enabled).toBe(false);

    expect(WebhookService.deleteSubscription(created.subscription.id)).toBe(
      true,
    );
    expect(WebhookService.listSubscriptions("ORG-1").length).toBe(0);
  });

  it("rotates secrets", () => {
    const created = WebhookService.createSubscription({
      organizationId: "ORG-1",
      endpointUrl: "https://example.com/hooks",
      eventTypes: ["trust.updated"],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const rotated = WebhookService.rotateSecret(created.subscription.id);
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;
    expect(rotated.subscription.secret).not.toBe(created.subscription.secret);
  });
});

describe("Webhooks — filtering", () => {
  it("matches event types and campaign filters", async () => {
    const created = WebhookService.createSubscription({
      organizationId: "ORG-1",
      endpointUrl: "https://example.com/hooks",
      eventTypes: ["assignment.completed"],
      filters: { campaignId: "CMP-1" },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const { SubscriptionRegistry } = await import(
      "@/lib/webhooks/subscription-registry"
    );
    const sub = SubscriptionRegistry.get(created.subscription.id)!;

    expect(
      FilterEngine.subscriptionMatches(sub, {
        id: "e1",
        event: "assignment.completed",
        occurredAt: new Date().toISOString(),
        requestId: "r1",
        organizationId: "ORG-1",
        campaignId: "CMP-1",
        data: {},
      }),
    ).toBe(true);

    expect(
      FilterEngine.subscriptionMatches(sub, {
        id: "e2",
        event: "assignment.completed",
        occurredAt: new Date().toISOString(),
        requestId: "r2",
        organizationId: "ORG-1",
        campaignId: "CMP-2",
        data: {},
      }),
    ).toBe(false);
  });
});

describe("Webhooks — delivery / signature / retry", () => {
  it("delivers signed payloads and records history", async () => {
    const created = WebhookService.createSubscription({
      organizationId: "ORG-1",
      endpointUrl: "https://hooks.example.com/z",
      eventTypes: ["assignment.completed"],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    let captured: {
      body: string;
      headers: Record<string, string>;
    } | null = null;

    DeliveryScheduler.setTransport(async ({ body, headers }) => {
      captured = { body, headers };
      return { status: 200, latencyMs: 12 };
    });

    const pub = WebhookService.publish({
      event: "assignment.completed",
      organizationId: "ORG-1",
      data: { assignmentId: "ASN-1" },
    });
    expect(pub.queued).toBe(1);
    await WebhookService.flush();

    expect(captured).toBeTruthy();
    const envelope = JSON.parse(captured!.body);
    expect(envelope.event).toBe("assignment.completed");
    expect(envelope.version).toBe("v1");
    expect(envelope.deliveryId).toBeTruthy();

    const ok = SignatureService.verify({
      secret: created.subscription.secret!,
      timestamp: captured!.headers["X-Zolanzo-Timestamp"]!,
      body: captured!.body,
      signatureHeader: captured!.headers["X-Zolanzo-Signature"]!,
    });
    expect(ok).toBe(true);

    const history = WebhookService.listHistory({ organizationId: "ORG-1" });
    expect(history[0]?.status).toBe("delivered");
  });

  it("retries then dead-letters after max attempts", async () => {
    const created = WebhookService.createSubscription({
      organizationId: "ORG-1",
      endpointUrl: "https://hooks.example.com/fail",
      eventTypes: ["payment.completed"],
      retryPolicy: {
        maxAttempts: 2,
        initialBackoffMs: 1,
        maxBackoffMs: 1,
        timeoutMs: 1000,
      },
    });
    expect(created.ok).toBe(true);

    DeliveryScheduler.setTransport(async () => ({
      status: 500,
      latencyMs: 5,
      error: "boom",
    }));

    WebhookService.publish({
      event: "payment.completed",
      organizationId: "ORG-1",
      data: { paymentId: "PAY-1" },
    });
    await WebhookService.flush();
    // force due retry immediately
    const { getDelivery, saveDelivery, enqueuePending } = await import(
      "@/lib/webhooks/store"
    );
    const pending = WebhookService.listHistory({ organizationId: "ORG-1" })[0]!;
    const record = getDelivery(pending.id)!;
    record.nextRetryAt = Date.now() - 1;
    saveDelivery(record);
    enqueuePending(record.id);
    await WebhookService.flush();

    const final = WebhookService.listHistory({ organizationId: "ORG-1" })[0]!;
    expect(final.status).toBe("dead_letter");
    expect(final.attempts).toBe(2);
  });
});

describe("Webhooks — replay & flags", () => {
  it("replays a delivery", async () => {
    const created = WebhookService.createSubscription({
      organizationId: "ORG-1",
      endpointUrl: "https://hooks.example.com/z",
      eventTypes: ["report.generated"],
    });
    expect(created.ok).toBe(true);

    DeliveryScheduler.setTransport(async () => ({
      status: 200,
      latencyMs: 3,
    }));
    WebhookService.publish({
      event: "report.generated",
      organizationId: "ORG-1",
      data: { reportId: "RPT-1" },
    });
    await WebhookService.flush();
    const original = WebhookService.listHistory({ organizationId: "ORG-1" })[0]!;
    const replayed = await WebhookService.replay(original.id);
    expect(replayed.ok).toBe(true);
    if (!replayed.ok) return;
    expect(replayed.delivery.replayOf).toBe(original.id);
  });

  it("respects PUBLIC_WEBHOOKS=0", () => {
    process.env.PUBLIC_WEBHOOKS = "0";
    expect(isPublicWebhooksEnabled()).toBe(false);
    const created = WebhookService.createSubscription({
      organizationId: "ORG-1",
      endpointUrl: "https://example.com",
      eventTypes: ["worker.created"],
    });
    expect(created.ok).toBe(false);
  });

  it("exposes event catalog and model version", () => {
    expect(WEBHOOK_EVENT_TYPES.length).toBe(20);
    expect(WEBHOOK_MODEL_VERSION).toContain("webhooks");
  });
});

describe("Webhooks — Public API surface", () => {
  it("creates subscription via /api/v1/webhooks", async () => {
    const { secret } = createApiKey({
      name: "hooks",
      organizationId: "ORG-1",
      scopes: ["webhooks.read", "webhooks.write", "webhooks.replay"],
    });
    const res = await handlePublicApiRequest({
      method: "POST",
      path: "/webhooks",
      headers: headers({
        "X-Api-Key": secret,
        "Idempotency-Key": "wh-create-1",
      }),
      query: new URLSearchParams(),
      body: {
        organizationId: "ORG-1",
        endpointUrl: "https://partner.example/hook",
        eventTypes: ["forecast.generated"],
      },
    });
    expect(res.status).toBe(200);
    const data = (res.body as { data: { eventTypes: string[]; secret: string } })
      .data;
    expect(data.eventTypes).toContain("forecast.generated");
    expect(data.secret).toBeTruthy();
  });
});
