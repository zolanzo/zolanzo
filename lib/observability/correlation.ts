/**
 * Correlation ID helpers — RFC4122 UUID primary trace key.
 */

export const CORRELATION_HEADER = "x-correlation-id" as const;
/** Alias used in docs / tests */
export const CORRELATION_ID_HEADER = CORRELATION_HEADER;
export const REQUEST_ID_HEADER = "x-request-id" as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

export function isValidCorrelationId(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function readCorrelationHeader(
  headers: Headers | Record<string, string | string[] | undefined>,
): string | null {
  if (headers instanceof Headers) {
    return (
      headers.get(CORRELATION_HEADER) ??
      headers.get("X-Correlation-ID") ??
      null
    );
  }
  const raw =
    headers[CORRELATION_HEADER] ??
    headers["X-Correlation-ID"] ??
    headers["X-Correlation-Id"];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

/**
 * Honor inbound X-Correlation-ID when it is a valid UUID; otherwise generate.
 * Accepts a raw header value or a Headers object.
 */
export function resolveCorrelationId(
  inbound?: string | null | Headers,
): string {
  if (inbound instanceof Headers) {
    const fromCorr = readCorrelationHeader(inbound);
    if (fromCorr && isValidCorrelationId(fromCorr)) {
      return fromCorr.trim();
    }
    const fromReq = inbound.get(REQUEST_ID_HEADER);
    if (fromReq && isValidCorrelationId(fromReq)) {
      return fromReq.trim();
    }
    return generateCorrelationId();
  }

  if (!inbound) return generateCorrelationId();
  const trimmed = inbound.trim();
  if (!isValidCorrelationId(trimmed)) return generateCorrelationId();
  return trimmed;
}

/**
 * Prefer x-request-id when valid; otherwise fall back to the resolved correlation id.
 */
export function resolveRequestId(
  headers: Headers,
  correlationId: string,
): string {
  const inbound = headers.get(REQUEST_ID_HEADER);
  if (inbound && isValidCorrelationId(inbound)) return inbound.trim();
  return correlationId;
}
