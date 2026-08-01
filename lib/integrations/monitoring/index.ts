/**
 * Monitoring adapter registry + capture helpers with correlation enrichment.
 */

import type { MonitoringEvent, MonitoringProviderAdapter } from "@/lib/integrations/monitoring/types";
import { memoryMonitoringAdapter } from "@/lib/integrations/monitoring/memory-adapter";
import { sentryMonitoringAdapter } from "@/lib/integrations/monitoring/sentry-adapter";
import { getRequestContext } from "@/lib/observability/request-context";
import { logUnhandledError } from "@/lib/observability/logger";
import { incrementCounter } from "@/lib/observability/metrics";

const BUILTIN: MonitoringProviderAdapter[] = [
  memoryMonitoringAdapter,
  sentryMonitoringAdapter,
];

export function listMonitoringAdapters(): MonitoringProviderAdapter[] {
  return [...BUILTIN];
}

export function selectMonitoringAdapter(params?: {
  providerKey?: string;
}): MonitoringProviderAdapter {
  if (params?.providerKey) {
    const found = BUILTIN.find((a) => a.providerKey === params.providerKey);
    if (!found) throw new Error(`Unknown monitoring provider: ${params.providerKey}`);
    return found;
  }
  // Prefer Sentry when DSN configured; otherwise memory.
  if (process.env.SENTRY_DSN?.trim()) return sentryMonitoringAdapter;
  return memoryMonitoringAdapter;
}

function enrich(event: MonitoringEvent): MonitoringEvent {
  const ctx = getRequestContext();
  return {
    ...event,
    correlationId: event.correlationId ?? ctx?.correlationId,
    requestId: event.requestId ?? ctx?.requestId,
    userId: event.userId ?? ctx?.userId,
    organizationId: event.organizationId ?? ctx?.organizationId,
    tags: {
      ...(ctx?.operation ? { operation: ctx.operation } : {}),
      ...(ctx?.module ? { module: ctx.module } : {}),
      ...(ctx?.jobName ? { jobName: ctx.jobName } : {}),
      ...event.tags,
    },
  };
}

export async function captureException(
  error: unknown,
  extras?: Omit<MonitoringEvent, "message" | "error"> & { message?: string },
): Promise<void> {
  const err =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  logUnhandledError(error, extras?.extras);
  incrementCounter("monitoring.exceptions");

  const adapter = selectMonitoringAdapter();
  // Always mirror to memory in non-sentry mode for local admin visibility
  if (adapter.providerKey !== "memory") {
    await memoryMonitoringAdapter.captureException(
      enrich({
        message: extras?.message ?? err.message,
        severity: "error",
        error: err,
        ...extras,
      }),
    );
  }
  await adapter.captureException(
    enrich({
      message: extras?.message ?? err.message,
      severity: "error",
      error: err,
      ...extras,
    }),
  );
}

export async function captureMessage(
  message: string,
  extras?: Omit<MonitoringEvent, "message">,
): Promise<void> {
  incrementCounter("monitoring.messages");
  const adapter = selectMonitoringAdapter();
  await adapter.captureMessage(
    enrich({
      message,
      severity: extras?.severity ?? "info",
      ...extras,
    }),
  );
}

export {
  memoryMonitoringAdapter,
  sentryMonitoringAdapter,
};
export {
  listCapturedMonitoringEvents,
  clearCapturedMonitoringEvents,
} from "@/lib/integrations/monitoring/memory-adapter";
export type { MonitoringProviderAdapter, MonitoringEvent } from "@/lib/integrations/monitoring/types";
