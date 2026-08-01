/**
 * Request / job async context — AsyncLocalStorage propagation.
 * Observability only; no domain state.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import {
  generateCorrelationId,
  resolveCorrelationId,
} from "@/lib/observability/correlation";

export type RequestContextStore = {
  correlationId: string;
  requestId: string;
  organizationId?: string;
  userId?: string;
  workerId?: string;
  clientId?: string;
  operation?: string;
  /** Stable operation / command public id when known (e.g. OPC-…) */
  operationId?: string;
  /** Background job name when running inside a job */
  jobName?: string;
  /** Job execution id */
  jobId?: string;
  /** External provider key (paystack, sendchamp, …) */
  provider?: string;
  /** True when this is a retry of a prior attempt */
  isRetry?: boolean;
  /** Retry / attempt number when known */
  attempt?: number;
  module?: string;
  startedAt: string;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore | undefined {
  return storage.getStore();
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

export function runWithRequestContext<T>(
  context: RequestContextStore,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

export async function runWithRequestContextAsync<T>(
  context: RequestContextStore,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(context, fn);
}

export function createRequestContext(params: {
  correlationId?: string | null;
  requestId?: string;
  organizationId?: string;
  userId?: string;
  workerId?: string;
  clientId?: string;
  operation?: string;
  operationId?: string;
  jobName?: string;
  jobId?: string;
  provider?: string;
  isRetry?: boolean;
  attempt?: number;
  module?: string;
}): RequestContextStore {
  const correlationId = resolveCorrelationId(params.correlationId);
  return {
    correlationId,
    requestId: params.requestId ?? generateCorrelationId(),
    organizationId: params.organizationId,
    userId: params.userId,
    workerId: params.workerId,
    clientId: params.clientId,
    operation: params.operation,
    operationId: params.operationId,
    jobName: params.jobName,
    jobId: params.jobId,
    provider: params.provider,
    isRetry: params.isRetry,
    attempt: params.attempt,
    module: params.module,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Merge identity / operation fields into the active context (same ALS store).
 */
export function enrichRequestContext(
  patch: Partial<
    Pick<
      RequestContextStore,
      | "organizationId"
      | "userId"
      | "workerId"
      | "clientId"
      | "operation"
      | "operationId"
      | "module"
      | "jobName"
      | "jobId"
      | "provider"
      | "isRetry"
      | "attempt"
    >
  >,
): void {
  const current = storage.getStore();
  if (!current) return;
  Object.assign(current, patch);
}

/**
 * Ensure a context exists for server actions / handlers.
 * Reuses existing ALS context when already entered.
 */
export function ensureRequestContext(params?: {
  correlationId?: string | null;
  operation?: string;
  module?: string;
}): RequestContextStore {
  const existing = storage.getStore();
  if (existing) {
    if (params?.operation) existing.operation = params.operation;
    if (params?.module) existing.module = params.module;
    return existing;
  }
  const ctx = createRequestContext({
    correlationId: params?.correlationId,
    operation: params?.operation,
    module: params?.module,
  });
  // Prefer runWithRequestContext for async work; enterWith seeds same-tick callers.
  storage.enterWith(ctx);
  return ctx;
}

/** Background / scheduled job context. Retries preserve original correlationId. */
export function createJobContext(params: {
  jobName: string;
  correlationId?: string | null;
  /** On retry, pass the original correlation id from the first attempt */
  originalCorrelationId?: string | null;
  isRetry?: boolean;
  attempt?: number;
  operation?: string;
}): RequestContextStore {
  const correlationId =
    params.isRetry && params.originalCorrelationId
      ? resolveCorrelationId(params.originalCorrelationId)
      : resolveCorrelationId(params.correlationId);
  return createRequestContext({
    correlationId,
    jobName: params.jobName,
    isRetry: params.isRetry ?? false,
    attempt: params.attempt,
    operation: params.operation ?? params.jobName,
    module: "jobs",
  });
}

export async function runJobWithContext<T>(
  params: {
    jobName: string;
    correlationId?: string | null;
    originalCorrelationId?: string | null;
    isRetry?: boolean;
    attempt?: number;
    operation?: string;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const ctx = createJobContext(params);
  return runWithRequestContextAsync(ctx, fn);
}

export async function runWebhookWithContext<T>(
  params: {
    provider: string;
    correlationId?: string | null;
    /** Alias for correlationId (inbound webhook header) */
    inboundCorrelationId?: string | null;
    organizationId?: string;
    operation?: string;
    module?: string;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const ctx = createRequestContext({
    correlationId: params.inboundCorrelationId ?? params.correlationId,
    organizationId: params.organizationId,
    operation: params.operation ?? `webhook.${params.provider}`,
    module: params.module ?? "payments.webhook",
  });
  return runWithRequestContextAsync(ctx, fn);
}
