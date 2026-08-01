/**
 * In-process application metrics (Phase 3A.4).
 * No business state — counters / gauges / latency histograms only.
 * Replaceable later with OpenTelemetry / Prometheus exporters.
 */

export type MetricLabels = Record<string, string | undefined>;

type CounterKey = string;
type HistSample = number[];

const MAX_SAMPLES = 500;

const counters = new Map<CounterKey, number>();
const gauges = new Map<CounterKey, number>();
const histograms = new Map<CounterKey, HistSample>();

function labelKey(name: string, labels?: MetricLabels): string {
  if (!labels) return name;
  const parts = Object.entries(labels)
    .filter(([, v]) => v != null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return parts.length ? `${name}|${parts.join(",")}` : name;
}

function parseKey(key: string): { name: string; labels: Record<string, string> } {
  const [name, rest] = key.split("|");
  const labels: Record<string, string> = {};
  if (rest) {
    for (const part of rest.split(",")) {
      const eq = part.indexOf("=");
      if (eq > 0) labels[part.slice(0, eq)] = part.slice(eq + 1);
    }
  }
  return { name: name ?? key, labels };
}

export function incrementCounter(
  name: string,
  labels?: MetricLabels,
  by = 1,
): void {
  const key = labelKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + by);
}

export function setGauge(
  name: string,
  value: number,
  labels?: MetricLabels,
): void {
  gauges.set(labelKey(name, labels), value);
}

export function observeDuration(
  name: string,
  durationMs: number,
  labels?: MetricLabels,
): void {
  const key = labelKey(name, labels);
  const samples = histograms.get(key) ?? [];
  samples.push(durationMs);
  if (samples.length > MAX_SAMPLES) samples.shift();
  histograms.set(key, samples);
}

export function clearMetrics(): void {
  counters.clear();
  gauges.clear();
  histograms.clear();
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx] ?? null;
}

export type HistogramSummary = {
  name: string;
  labels: Record<string, string>;
  count: number;
  sum: number;
  avg: number | null;
  p50: number | null;
  p95: number | null;
  max: number | null;
};

export type MetricsSnapshot = {
  generatedAt: string;
  counters: Array<{ name: string; labels: Record<string, string>; value: number }>;
  gauges: Array<{ name: string; labels: Record<string, string>; value: number }>;
  histograms: HistogramSummary[];
  /** Derived ops signals */
  derived: {
    httpRequestCount: number;
    httpErrorCount: number;
    httpErrorRate: number | null;
    processingLatencyMs: number | null;
    webhookReceived: number;
    webhookVerified: number;
    webhookRejected: number;
    webhookReplayBlocked: number;
    jobFailures: number;
    jobRetries: number;
    paymentInitiated: number;
    paymentCompleted: number;
    paymentFailed: number;
    notificationJobs: number;
  };
};

function sumCounters(prefix: string): number {
  let total = 0;
  for (const [key, value] of counters) {
    if (key === prefix || key.startsWith(`${prefix}|`)) total += value;
  }
  return total;
}

function overallLatencyP95(): number | null {
  const all: number[] = [];
  for (const [key, samples] of histograms) {
    if (
      key.startsWith("http.request.duration_ms") ||
      key.startsWith("job.execution.duration_ms")
    ) {
      all.push(...samples);
    }
  }
  if (all.length === 0) return null;
  all.sort((a, b) => a - b);
  return percentile(all, 95);
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const counterRows = [...counters.entries()].map(([key, value]) => {
    const { name, labels } = parseKey(key);
    return { name, labels, value };
  });
  const gaugeRows = [...gauges.entries()].map(([key, value]) => {
    const { name, labels } = parseKey(key);
    return { name, labels, value };
  });
  const histRows: HistogramSummary[] = [...histograms.entries()].map(
    ([key, samples]) => {
      const { name, labels } = parseKey(key);
      const sorted = [...samples].sort((a, b) => a - b);
      const sum = samples.reduce((a, b) => a + b, 0);
      return {
        name,
        labels,
        count: samples.length,
        sum,
        avg: samples.length ? sum / samples.length : null,
        p50: percentile(sorted, 50),
        p95: percentile(sorted, 95),
        max: sorted.length ? sorted[sorted.length - 1]! : null,
      };
    },
  );

  const httpRequestCount = sumCounters("http.request.count");
  const httpErrorCount = sumCounters("http.request.errors");
  const webhookReceived = sumCounters("webhook.received");
  const webhookVerified = sumCounters("webhook.verified");
  const webhookRejected = sumCounters("webhook.rejected");
  const webhookReplayBlocked = sumCounters("webhook.replay_blocked");
  const jobFailures = sumCounters("job.execution.failures");
  const jobRetries = sumCounters("job.execution.retries");
  const paymentInitiated = sumCounters("payment.initiated");
  const paymentCompleted = sumCounters("payment.completed");
  const paymentFailed = sumCounters("payment.failed");
  const notificationJobs = sumCounters("notification.jobs");

  return {
    generatedAt: new Date().toISOString(),
    counters: counterRows,
    gauges: gaugeRows,
    histograms: histRows,
    derived: {
      httpRequestCount,
      httpErrorCount,
      httpErrorRate:
        httpRequestCount > 0 ? httpErrorCount / httpRequestCount : null,
      processingLatencyMs: overallLatencyP95(),
      webhookReceived,
      webhookVerified,
      webhookRejected,
      webhookReplayBlocked,
      jobFailures,
      jobRetries,
      paymentInitiated,
      paymentCompleted,
      paymentFailed,
      notificationJobs,
    },
  };
}

/** Convenience domain recorders — observability only. */
export const metrics = {
  httpRequest(params: {
    route: string;
    status: number;
    durationMs: number;
  }): void {
    const outcome = params.status >= 500 ? "error" : "ok";
    incrementCounter("http.request.count", {
      route: params.route,
      outcome,
    });
    observeDuration("http.request.duration_ms", params.durationMs, {
      route: params.route,
    });
    if (params.status >= 500) {
      incrementCounter("http.request.errors", { route: params.route });
    }
  },
  dbQuery(params: { operation: string; durationMs: number; ok: boolean }): void {
    observeDuration("db.query.duration_ms", params.durationMs, {
      operation: params.operation,
    });
    if (!params.ok) {
      incrementCounter("db.query.failures", { operation: params.operation });
    }
  },
  job(params: {
    jobName: string;
    durationMs: number;
    ok: boolean;
    retries?: number;
  }): void {
    observeDuration("job.execution.duration_ms", params.durationMs, {
      job: params.jobName,
      outcome: params.ok ? "ok" : "error",
    });
    if (!params.ok) {
      incrementCounter("job.execution.failures", { job: params.jobName });
    }
    if (params.retries && params.retries > 0) {
      incrementCounter("job.execution.retries", { job: params.jobName }, params.retries);
    }
  },
  setQueueDepth(depth: number): void {
    setGauge("job.queue.depth", depth);
  },
  webhook(params: {
    provider: string;
    outcome: "received" | "verified" | "rejected" | "replay_blocked";
  }): void {
    incrementCounter(`webhook.${params.outcome}`, {
      provider: params.provider,
    });
    if (params.outcome !== "received") {
      incrementCounter("webhook.received", { provider: params.provider });
    }
  },
  payment(params: {
    outcome: "initiated" | "completed" | "failed" | "refunded";
    provider?: string;
  }): void {
    incrementCounter(`payment.${params.outcome}`, {
      provider: params.provider,
    });
  },
  withdrawal(params: {
    outcome: "pending" | "approved" | "rejected" | "completed" | "failed";
  }): void {
    incrementCounter(`withdrawal.${params.outcome}`);
  },
  notification(params: {
    channel: string;
    outcome: "queued" | "delivered" | "failed";
  }): void {
    incrementCounter("notification.jobs", {
      channel: params.channel,
      outcome: params.outcome,
    });
  },
};
