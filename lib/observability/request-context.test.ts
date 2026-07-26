import { describe, expect, it } from "vitest";
import {
  createJobContext,
  enrichRequestContext,
  ensureRequestContext,
  getRequestContext,
  runJobWithContext,
  runWebhookWithContext,
  runWithRequestContext,
} from "@/lib/observability/request-context";
import { createLogger } from "@/lib/observability/logger";

describe("request context async propagation", () => {
  it("propagates correlation through nested async work", async () => {
    const correlationId = "11111111-2222-4333-a444-555555555555";
    const seen = await runWithRequestContext(
      {
        correlationId,
        requestId: correlationId,
        operation: "test.nested",
        module: "test",
        organizationId: "org_1",
        userId: "user_1",
        startedAt: new Date().toISOString(),
      },
      async () => {
        await Promise.resolve();
        return getRequestContext();
      },
    );
    expect(seen?.correlationId).toBe(correlationId);
    expect(seen?.organizationId).toBe("org_1");
    expect(seen?.userId).toBe("user_1");
    expect(seen?.operation).toBe("test.nested");
  });

  it("enrichRequestContext merges identities without dropping correlation", async () => {
    await runWithRequestContext(
      {
        correlationId: "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee",
        requestId: "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee",
        operation: "test.enrich",
        module: "test",
        startedAt: new Date().toISOString(),
      },
      () => {
        enrichRequestContext({ workerId: "w1", clientId: "c1" });
        const ctx = getRequestContext();
        expect(ctx?.workerId).toBe("w1");
        expect(ctx?.clientId).toBe("c1");
        expect(ctx?.correlationId).toBe(
          "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee",
        );
      },
    );
  });

  it("ensureRequestContext creates a root when missing", () => {
    const ctx = ensureRequestContext({
      operation: "test.ensure",
      module: "test",
    });
    expect(ctx.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(getRequestContext()?.operation).toBe("test.ensure");
  });

  it("job context preserves original correlation on retry", async () => {
    const original = "11111111-2222-4333-a444-555555555555";
    const first = createJobContext({
      jobName: "reconcile-wallets",
      correlationId: original,
    });
    expect(first.correlationId).toBe(original);
    expect(first.isRetry).toBe(false);

    const retry = createJobContext({
      jobName: "reconcile-wallets",
      originalCorrelationId: original,
      isRetry: true,
      attempt: 2,
    });
    expect(retry.correlationId).toBe(original);
    expect(retry.isRetry).toBe(true);
    expect(retry.attempt).toBe(2);

    const result = await runJobWithContext(
      {
        jobName: "reconcile-wallets",
        originalCorrelationId: original,
        isRetry: true,
        attempt: 3,
      },
      async () => getRequestContext()?.correlationId,
    );
    expect(result).toBe(original);
  });

  it("webhook context uses inbound correlation or generates one", async () => {
    const inbound = "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee";
    const withInbound = await runWebhookWithContext(
      {
        provider: "paystack",
        inboundCorrelationId: inbound,
        organizationId: "org_pay",
      },
      async () => getRequestContext(),
    );
    expect(withInbound?.correlationId).toBe(inbound);
    expect(withInbound?.module).toBe("payments.webhook");
    expect(withInbound?.organizationId).toBe("org_pay");

    const generated = await runWebhookWithContext(
      { provider: "stripe" },
      async () => getRequestContext()?.correlationId,
    );
    expect(generated).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("logger automatically includes correlation and identities", async () => {
    const lines: string[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      lines.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      await runWithRequestContext(
        {
          correlationId: "11111111-2222-4333-a444-555555555555",
          requestId: "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee",
          operation: "test.log",
          module: "test",
          organizationId: "org_x",
          userId: "user_x",
          workerId: "worker_x",
          clientId: "client_x",
          startedAt: new Date().toISOString(),
        },
        () => {
          createLogger("test").info("hello", { foo: "bar" });
        },
      );
    } finally {
      process.stdout.write = originalWrite;
    }

    expect(lines.length).toBe(1);
    const payload = JSON.parse(lines[0]!.trim()) as Record<string, unknown>;
    expect(payload.correlationId).toBe(
      "11111111-2222-4333-a444-555555555555",
    );
    expect(payload.requestId).toBe("aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee");
    expect(payload.organizationId).toBe("org_x");
    expect(payload.userId).toBe("user_x");
    expect(payload.workerId).toBe("worker_x");
    expect(payload.clientId).toBe("client_x");
    expect(payload.operation).toBe("test.log");
    expect(payload.module).toBe("test");
    expect(payload.foo).toBe("bar");
  });
});
