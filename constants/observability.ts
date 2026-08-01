/**
 * Observability contracts — metrics, logs, health.
 */

export const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const METRIC_CATEGORIES = [
  "http",
  "queue",
  "database",
  "cache",
  "payments",
  "work_engine",
  "finance",
  "auth",
  "webhooks",
  "notifications",
  "jobs",
  "monitoring",
] as const;

export const HEALTH_CHECKS = [
  "app_alive",
  "database",
  "redis",
  "storage",
  "queue",
  "supabase_auth",
  "scheduler",
  "environment",
  "background_workers",
] as const;

export type HealthCheckId = (typeof HEALTH_CHECKS)[number];

export type HealthStatus = "ok" | "degraded" | "down";

export type HealthCheckResult = {
  id: HealthCheckId;
  status: HealthStatus;
  latencyMs?: number;
  detail?: string;
};

/**
 * Suggested OpenTelemetry / internal span names.
 */
export const TRACE_SPANS = [
  "http.request",
  "db.query",
  "queue.enqueue",
  "queue.process",
  "ledger.post",
  "escrow.release",
  "validation.run",
  "email.send",
  "sms.send",
  "webhook.verify",
  "webhook.deliver",
  "payment.intent",
  "payment.webhook",
  "withdrawal.process",
  "notification.dispatch",
  "ai.execute",
  "ops.command",
  "job.execute",
] as const;
