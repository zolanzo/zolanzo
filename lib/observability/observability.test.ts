import { afterEach, describe, expect, it } from "vitest";
import {
  clearMetrics,
  getMetricsSnapshot,
  metrics,
  incrementCounter,
  setGauge,
} from "@/lib/observability/metrics";
import {
  evaluateAlerts,
  DEFAULT_ALERT_THRESHOLDS,
} from "@/lib/observability/alerts";
import { redactFields } from "@/lib/observability/redact";
import { startSpan, endSpan, withSpan } from "@/lib/observability/trace";
import {
  clearCapturedMonitoringEvents,
  listCapturedMonitoringEvents,
  memoryMonitoringAdapter,
  selectMonitoringAdapter,
  captureException,
  captureMessage,
} from "@/lib/integrations/monitoring";
import { getLiveHealth } from "@/lib/observability/probes";
import { HEALTH_CHECKS } from "@/constants/observability";
import { runWithRequestContextAsync, createRequestContext } from "@/lib/observability/request-context";
import { createLogger } from "@/lib/observability/logger";

afterEach(() => {
  clearMetrics();
  clearCapturedMonitoringEvents();
});

describe("metrics registry", () => {
  it("records http request count, latency, and error rate", () => {
    metrics.httpRequest({ route: "/api/x", status: 200, durationMs: 12 });
    metrics.httpRequest({ route: "/api/x", status: 500, durationMs: 40 });
    const snap = getMetricsSnapshot();
    expect(snap.derived.httpRequestCount).toBe(2);
    expect(snap.derived.httpErrorCount).toBe(1);
    expect(snap.derived.httpErrorRate).toBe(0.5);
    expect(snap.derived.processingLatencyMs).not.toBeNull();
  });

  it("records webhook outcomes", () => {
    metrics.webhook({ provider: "paystack", outcome: "verified" });
    metrics.webhook({ provider: "paystack", outcome: "rejected" });
    metrics.webhook({ provider: "paystack", outcome: "replay_blocked" });
    const snap = getMetricsSnapshot();
    expect(snap.derived.webhookVerified).toBe(1);
    expect(snap.derived.webhookRejected).toBe(1);
    expect(snap.derived.webhookReplayBlocked).toBe(1);
  });

  it("records job and payment counters", () => {
    metrics.job({ jobName: "test.job", durationMs: 5, ok: false, retries: 2 });
    metrics.payment({ outcome: "initiated", provider: "memory" });
    metrics.payment({ outcome: "completed", provider: "memory" });
    const snap = getMetricsSnapshot();
    expect(snap.derived.jobFailures).toBe(1);
    expect(snap.derived.jobRetries).toBe(2);
    expect(snap.derived.paymentInitiated).toBe(1);
    expect(snap.derived.paymentCompleted).toBe(1);
  });
});

describe("alert evaluation", () => {
  it("fires http_5xx_spike when error rate exceeds threshold", () => {
    metrics.httpRequest({ route: "/a", status: 500, durationMs: 10 });
    metrics.httpRequest({ route: "/a", status: 500, durationMs: 10 });
    const alerts = evaluateAlerts({ metrics: getMetricsSnapshot() });
    expect(alerts.some((a) => a.key === "http_5xx_spike")).toBe(true);
  });

  it("fires webhook_failures when rejects exceed threshold", () => {
    for (let i = 0; i < 11; i += 1) {
      metrics.webhook({ provider: "x", outcome: "rejected" });
    }
    const alerts = evaluateAlerts({ metrics: getMetricsSnapshot() });
    expect(alerts.some((a) => a.key === "webhook_failures")).toBe(true);
  });

  it("fires queue_backlog from gauge", () => {
    setGauge("job.queue.depth", 100);
    const alerts = evaluateAlerts({ metrics: getMetricsSnapshot() });
    expect(alerts.some((a) => a.key === "queue_backlog")).toBe(true);
  });

  it("fires database_unavailable from probe context", () => {
    const alerts = evaluateAlerts({
      metrics: getMetricsSnapshot(),
      probes: { databaseDown: true },
    });
    expect(alerts.some((a) => a.key === "database_unavailable")).toBe(true);
  });

  it("exposes default threshold catalog", () => {
    expect(DEFAULT_ALERT_THRESHOLDS.length).toBeGreaterThanOrEqual(7);
  });
});

describe("log redaction", () => {
  it("redacts secrets and tokens", () => {
    const redacted = redactFields({
      password: "hunter2",
      authorization: "Bearer abc",
      safe: "ok",
      nested: { apiKey: "x", count: 1 },
    });
    expect(redacted?.password).toBe("[REDACTED]");
    expect(redacted?.authorization).toBe("[REDACTED]");
    expect(redacted?.safe).toBe("ok");
    expect((redacted?.nested as Record<string, unknown>).apiKey).toBe(
      "[REDACTED]",
    );
    expect((redacted?.nested as Record<string, unknown>).count).toBe(1);
  });

  it("logger merges correlation and redacts fields", async () => {
    const lines: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      lines.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      await runWithRequestContextAsync(
        createRequestContext({
          correlationId: "11111111-1111-4111-8111-111111111111",
          operation: "test.op",
          userId: "u1",
        }),
        async () => {
          createLogger("test").info("hello", { secret: "nope", durationMs: 3 });
        },
      );
    } finally {
      process.stdout.write = original;
    }

    const parsed = JSON.parse(lines[0]!);
    expect(parsed.correlationId).toBe("11111111-1111-4111-8111-111111111111");
    expect(parsed.operation).toBe("test.op");
    expect(parsed.secret).toBe("[REDACTED]");
    expect(parsed.durationMs).toBe(3);
  });
});

describe("tracing", () => {
  it("records span durations", async () => {
    await withSpan("http.request", { route: "/x" }, async () => {
      await new Promise((r) => setTimeout(r, 1));
      return 1;
    });
    const snap = getMetricsSnapshot();
    expect(
      snap.histograms.some((h) => h.name === "trace.span.duration_ms"),
    ).toBe(true);
  });

  it("ends span on error", () => {
    const span = startSpan("db.query", { op: "x" });
    endSpan(span, "error", { errorCode: "X" });
    expect(true).toBe(true);
  });
});

describe("monitoring adapter", () => {
  it("selects memory by default without DSN", () => {
    delete process.env.SENTRY_DSN;
    expect(selectMonitoringAdapter().providerKey).toBe("memory");
  });

  it("captures exceptions into memory buffer", async () => {
    await captureException(new Error("boom"), {
      message: "test boom",
      tags: { area: "test" },
    });
    const events = listCapturedMonitoringEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.message.includes("boom"))).toBe(true);
  });

  it("captures messages", async () => {
    await captureMessage("hello monitor", { severity: "info" });
    expect(
      listCapturedMonitoringEvents().some((e) => e.message === "hello monitor"),
    ).toBe(true);
  });

  it("memory adapter accepts events", async () => {
    const res = await memoryMonitoringAdapter.captureException({
      message: "x",
      error: { message: "x" },
    });
    expect(res.accepted).toBe(true);
  });
});

describe("health endpoints payload", () => {
  it("includes background_workers in HEALTH_CHECKS catalog", () => {
    expect(HEALTH_CHECKS).toContain("background_workers");
  });

  it("live health returns ok with app_alive", async () => {
    const body = await getLiveHealth({ name: "zolanzo", version: "0.1.0" });
    expect(body.status).toBe("ok");
    expect(body.checks.some((c) => c.id === "app_alive")).toBe(true);
    incrementCounter("http.request.count"); // smoke
  });
});
