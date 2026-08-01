/**
 * Lightweight distributed tracing spans (correlation-first).
 * Logs span start/end; no vendor SDK. OpenTelemetry export later.
 */

import { createLogger } from "@/lib/observability/logger";
import { getCorrelationId, getRequestContext } from "@/lib/observability/request-context";
import { observeDuration } from "@/lib/observability/metrics";

const log = createLogger("trace");

export type SpanName =
  | "http.request"
  | "db.query"
  | "queue.enqueue"
  | "queue.process"
  | "ledger.post"
  | "escrow.release"
  | "validation.run"
  | "email.send"
  | "sms.send"
  | "webhook.verify"
  | "webhook.deliver"
  | "payment.intent"
  | "payment.webhook"
  | "withdrawal.process"
  | "notification.dispatch"
  | "ai.execute"
  | "ops.command"
  | "job.execute"
  | (string & {});

export type SpanOutcome = "ok" | "error" | "skipped";

export type ActiveSpan = {
  name: SpanName;
  spanId: string;
  startedAt: number;
  attributes: Record<string, string | number | boolean | undefined>;
};

function newSpanId(): string {
  return `sp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function startSpan(
  name: SpanName,
  attributes: ActiveSpan["attributes"] = {},
): ActiveSpan {
  const span: ActiveSpan = {
    name,
    spanId: newSpanId(),
    startedAt: Date.now(),
    attributes,
  };
  log.debug("span.start", {
    span: name,
    spanId: span.spanId,
    correlationId: getCorrelationId(),
    ...attributes,
  });
  return span;
}

export function endSpan(
  span: ActiveSpan,
  outcome: SpanOutcome = "ok",
  extra?: Record<string, unknown>,
): number {
  const durationMs = Date.now() - span.startedAt;
  observeDuration("trace.span.duration_ms", durationMs, {
    span: span.name,
    outcome,
  });
  const level = outcome === "error" ? "warn" : "debug";
  log[level]("span.end", {
    span: span.name,
    spanId: span.spanId,
    durationMs,
    outcome,
    correlationId: getCorrelationId(),
    ...span.attributes,
    ...extra,
  });
  return durationMs;
}

export async function withSpan<T>(
  name: SpanName,
  attributes: ActiveSpan["attributes"],
  fn: () => Promise<T>,
): Promise<T> {
  const span = startSpan(name, attributes);
  try {
    const result = await fn();
    endSpan(span, "ok");
    return result;
  } catch (error) {
    endSpan(span, "error", {
      errorCode:
        error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : undefined,
      err:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: String(error) },
    });
    throw error;
  }
}

/**
 * Snapshot of active request context for reconstructing an execution path.
 */
export function traceBreadcrumb(operation: string): Record<string, unknown> {
  const ctx = getRequestContext();
  return {
    operation,
    correlationId: ctx?.correlationId,
    requestId: ctx?.requestId,
    userId: ctx?.userId,
    organizationId: ctx?.organizationId,
    jobName: ctx?.jobName,
    module: ctx?.module,
  };
}
