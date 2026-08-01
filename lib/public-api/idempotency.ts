/**
 * Idempotency store for mutating Public API requests.
 */

import { IDEMPOTENCY_HEADER } from "@/constants/api";
import { recordPublicApiIdempotencyHit } from "@/lib/public-api/telemetry";
import { PublicApiError } from "@/lib/public-api/errors";

type IdempotencyEntry = {
  key: string;
  principalId: string;
  method: string;
  path: string;
  status: number;
  body: unknown;
  createdAt: string;
};

const store = new Map<string, IdempotencyEntry>();

function compositeKey(
  principalId: string,
  method: string,
  path: string,
  key: string,
): string {
  return `${principalId}:${method}:${path}:${key}`;
}

export function resetIdempotencyStoreForTests(): void {
  store.clear();
}

export function getIdempotencyKey(headers: Headers): string | null {
  return headers.get(IDEMPOTENCY_HEADER) ?? headers.get("idempotency-key");
}

export function lookupIdempotentResponse(params: {
  principalId: string;
  method: string;
  path: string;
  key: string;
}): { status: number; body: unknown } | null {
  const entry = store.get(
    compositeKey(params.principalId, params.method, params.path, params.key),
  );
  if (!entry) return null;
  recordPublicApiIdempotencyHit();
  return { status: entry.status, body: entry.body };
}

export function storeIdempotentResponse(params: {
  principalId: string;
  method: string;
  path: string;
  key: string;
  status: number;
  body: unknown;
}): void {
  store.set(
    compositeKey(params.principalId, params.method, params.path, params.key),
    {
      key: params.key,
      principalId: params.principalId,
      method: params.method,
      path: params.path,
      status: params.status,
      body: params.body,
      createdAt: new Date().toISOString(),
    },
  );
}

export function requireIdempotencyKey(
  headers: Headers,
  mutating: boolean,
): string | null {
  const key = getIdempotencyKey(headers);
  if (mutating && !key) {
    throw new PublicApiError(
      "VALIDATION_ERROR",
      `Mutating requests require ${IDEMPOTENCY_HEADER} header`,
      400,
    );
  }
  return key;
}
