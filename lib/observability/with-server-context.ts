/**
 * Server-only helpers to bind Next.js headers into RequestContext.
 */

import "server-only";

import { headers } from "next/headers";
import {
  CORRELATION_HEADER,
  readCorrelationHeader,
} from "@/lib/observability/correlation";
import {
  createRequestContext,
  enrichRequestContext,
  getRequestContext,
  runWithRequestContextAsync,
  type RequestContextStore,
} from "@/lib/observability/request-context";

/**
 * Build context from the current Next.js request headers (Server Actions / RSC).
 */
export async function contextFromNextHeaders(params?: {
  operation?: string;
  module?: string;
  userId?: string;
  organizationId?: string;
}): Promise<RequestContextStore> {
  const h = await headers();
  const inbound = readCorrelationHeader(h);
  return createRequestContext({
    correlationId: inbound,
    operation: params?.operation,
    module: params?.module ?? "server",
    userId: params?.userId,
    organizationId: params?.organizationId,
  });
}

/**
 * Run an async function inside ALS context derived from Next headers.
 * No-op nesting: if already inside a context, enriches and continues.
 */
export async function withServerRequestContext<T>(
  params: {
    operation?: string;
    module?: string;
    userId?: string;
    organizationId?: string;
    workerId?: string;
    clientId?: string;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const existing = getRequestContext();
  if (existing) {
    enrichRequestContext({
      operation: params.operation,
      module: params.module,
      userId: params.userId,
      organizationId: params.organizationId,
      workerId: params.workerId,
      clientId: params.clientId,
    });
    return fn();
  }

  const ctx = await contextFromNextHeaders(params);
  if (params.workerId) ctx.workerId = params.workerId;
  if (params.clientId) ctx.clientId = params.clientId;
  return runWithRequestContextAsync(ctx, fn);
}

export { CORRELATION_HEADER };
