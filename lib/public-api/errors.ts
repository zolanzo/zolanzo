/**
 * Public API error model — stable external contract.
 */

import type { PublicErrorEnvelope } from "@/lib/public-api/types";

export const PUBLIC_ERROR_DOCS = "/docs/api/errors";

export const PUBLIC_ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "RATE_LIMITED",
  "IDEMPOTENCY_CONFLICT",
  "FEATURE_DISABLED",
  "CONFLICT",
  "INTERNAL_ERROR",
  "SCOPE_DENIED",
  "UNSUPPORTED_VERSION",
] as const;

export type PublicErrorCode = (typeof PUBLIC_ERROR_CODES)[number];

export class PublicApiError extends Error {
  readonly code: PublicErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PublicErrorCode,
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PublicApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toPublicErrorEnvelope(
  err: PublicApiError | Error,
  requestId: string,
): PublicErrorEnvelope {
  if (err instanceof PublicApiError) {
    return {
      error: {
        code: err.code,
        message: err.message,
        requestId,
        documentation: PUBLIC_ERROR_DOCS,
        ...(err.details ? { details: err.details } : {}),
      },
    };
  }
  return {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
      documentation: PUBLIC_ERROR_DOCS,
    },
  };
}

export function successEnvelope<T>(
  data: T,
  requestId: string,
  page?: { nextCursor: string | null; hasMore: boolean },
) {
  return {
    data,
    meta: { requestId, apiVersion: "v1" as const },
    ...(page ? { page } : {}),
  };
}
