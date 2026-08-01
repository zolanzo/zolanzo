/**
 * Configurable alert thresholds + evaluation against metrics snapshot.
 */

import type { MetricsSnapshot } from "@/lib/observability/metrics";

export const ALERT_THRESHOLD_KEYS = [
  "http_5xx_spike",
  "webhook_failures",
  "queue_backlog",
  "failed_withdrawals",
  "database_unavailable",
  "storage_unavailable",
  "high_latency",
  "job_failures",
] as const;

export type AlertThresholdKey = (typeof ALERT_THRESHOLD_KEYS)[number];

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertThreshold = {
  key: AlertThresholdKey;
  description: string;
  severity: AlertSeverity;
  /** Numeric limit — meaning depends on key */
  threshold: number;
};

export const DEFAULT_ALERT_THRESHOLDS: readonly AlertThreshold[] = [
  {
    key: "http_5xx_spike",
    description: "HTTP 5xx error rate exceeds threshold",
    severity: "critical",
    threshold: 0.05, // 5%
  },
  {
    key: "webhook_failures",
    description: "Webhook reject count exceeds threshold",
    severity: "critical",
    threshold: 10,
  },
  {
    key: "queue_backlog",
    description: "In-process job queue depth exceeds threshold",
    severity: "warning",
    threshold: 25,
  },
  {
    key: "failed_withdrawals",
    description: "Failed withdrawal metric exceeds threshold",
    severity: "critical",
    threshold: 5,
  },
  {
    key: "database_unavailable",
    description: "Database probe reported down",
    severity: "critical",
    threshold: 1,
  },
  {
    key: "storage_unavailable",
    description: "Storage probe reported down",
    severity: "warning",
    threshold: 1,
  },
  {
    key: "high_latency",
    description: "Processing latency p95 exceeds threshold (ms)",
    severity: "warning",
    threshold: 2_000,
  },
  {
    key: "job_failures",
    description: "Background job failure count exceeds threshold",
    severity: "warning",
    threshold: 5,
  },
] as const;

export type FiredAlert = {
  key: AlertThresholdKey;
  severity: AlertSeverity;
  description: string;
  observed: number;
  threshold: number;
  firedAt: string;
};

export type AlertEvaluationContext = {
  metrics: MetricsSnapshot;
  /** Probe statuses: database/storage down flags */
  probes?: {
    databaseDown?: boolean;
    storageDown?: boolean;
  };
  /** Domain counts from ops dashboard */
  domain?: {
    failedWithdrawals?: number;
  };
  thresholds?: readonly AlertThreshold[];
};

function counterSum(
  metrics: MetricsSnapshot,
  name: string,
): number {
  return metrics.counters
    .filter((c) => c.name === name)
    .reduce((a, c) => a + c.value, 0);
}

export function evaluateAlerts(
  ctx: AlertEvaluationContext,
): FiredAlert[] {
  const thresholds = ctx.thresholds ?? DEFAULT_ALERT_THRESHOLDS;
  const now = new Date().toISOString();
  const fired: FiredAlert[] = [];
  const d = ctx.metrics.derived;

  for (const t of thresholds) {
    let observed: number | null = null;
    switch (t.key) {
      case "http_5xx_spike":
        observed = d.httpErrorRate;
        break;
      case "webhook_failures":
        observed = d.webhookRejected + d.webhookReplayBlocked;
        break;
      case "queue_backlog": {
        const gauge = ctx.metrics.gauges.find((g) => g.name === "job.queue.depth");
        observed = gauge?.value ?? 0;
        break;
      }
      case "failed_withdrawals":
        observed =
          ctx.domain?.failedWithdrawals ??
          counterSum(ctx.metrics, "withdrawal.failed");
        break;
      case "database_unavailable":
        observed = ctx.probes?.databaseDown ? 1 : 0;
        break;
      case "storage_unavailable":
        observed = ctx.probes?.storageDown ? 1 : 0;
        break;
      case "high_latency":
        observed = d.processingLatencyMs;
        break;
      case "job_failures":
        observed = d.jobFailures;
        break;
      default:
        observed = null;
    }

    if (observed == null) continue;
    if (observed >= t.threshold) {
      fired.push({
        key: t.key,
        severity: t.severity,
        description: t.description,
        observed,
        threshold: t.threshold,
        firedAt: now,
      });
    }
  }

  return fired;
}
