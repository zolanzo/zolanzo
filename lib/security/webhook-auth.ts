/**
 * Provider-agnostic webhook authentication.
 * Used by payment (and future SMS/email/push) ingress adapters.
 *
 * Requirements: HMAC signature, timestamp skew, replay protection,
 * secret rotation, constant-time compare, structured audit logs.
 */

import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { timingSafeEqual } from "@/lib/security/csrf";
import { logger } from "@/lib/observability/logger";
import { AppError } from "@/lib/api/response";
import { metrics } from "@/lib/observability/metrics";
import { startSpan, endSpan } from "@/lib/observability/trace";
import { captureMessage } from "@/lib/integrations/monitoring";

export const WEBHOOK_HEADERS = {
  signature: "x-webhook-signature",
  timestamp: "x-webhook-timestamp",
  eventId: "x-webhook-id",
  /** Provider-specific aliases accepted as signature carriers */
  aliases: [
    "x-payment-signature",
    "x-paystack-signature",
    "stripe-signature",
    "verif-hash",
    "x-resend-signature",
    "x-sendchamp-signature",
  ],
} as const;

const DEFAULT_MAX_SKEW_SECONDS = 300;
const DEFAULT_REPLAY_TTL_MS = 15 * 60 * 1000;

/** In-memory replay cache (process-local). Replace with Redis in Phase 3A.4+. */
const replayCache = new Map<string, number>();

export type WebhookSecretSet = {
  /** Current + previous secrets for rotation (first = preferred for signing). */
  secrets: string[];
};

export type VerifyWebhookInput = {
  provider: string;
  headers: Record<string, string>;
  body: string;
  secrets?: WebhookSecretSet;
  maxSkewSeconds?: number;
  replayTtlMs?: number;
};

export type VerifyWebhookResult = {
  ok: true;
  eventId: string;
  timestamp: number;
  matchedSecretIndex: number;
};

function normalizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k.toLowerCase()] = v;
  }
  return out;
}

function readSignature(headers: Record<string, string>): string | null {
  const direct = headers[WEBHOOK_HEADERS.signature];
  if (direct) return stripSignaturePrefix(direct);
  for (const alias of WEBHOOK_HEADERS.aliases) {
    const v = headers[alias];
    if (v) return stripSignaturePrefix(v);
  }
  return null;
}

/** Stripe-style `t=...,v1=...` or bare hex/base64. */
function stripSignaturePrefix(raw: string): string {
  const trimmed = raw.trim();
  const v1 = /(?:^|,)\s*v1=([a-fA-F0-9]+)/.exec(trimmed);
  if (v1?.[1]) return v1[1];
  if (trimmed.startsWith("sha256=")) return trimmed.slice("sha256=".length);
  return trimmed;
}

export function resolveWebhookSecrets(
  explicit?: WebhookSecretSet,
): WebhookSecretSet {
  if (explicit?.secrets.length) return explicit;

  const primary = process.env.WEBHOOK_SIGNING_SECRET?.trim();
  const rotated = process.env.WEBHOOK_SIGNING_SECRETS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const secrets = [
    ...(primary ? [primary] : []),
    ...(rotated ?? []),
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  return { secrets };
}

export function signWebhookBody(params: {
  body: string;
  timestamp: number | string;
  secret: string;
}): string {
  const payload = `${params.timestamp}.${params.body}`;
  return createHmac("sha256", params.secret).update(payload).digest("hex");
}

function safeHexEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length === 0 || bb.length === 0 || ba.length !== bb.length) {
      return timingSafeEqual(a, b);
    }
    return nodeTimingSafeEqual(ba, bb);
  } catch {
    return timingSafeEqual(a, b);
  }
}

export function verifyHmacAgainstSecrets(params: {
  body: string;
  timestamp: string;
  signature: string;
  secrets: string[];
}): { ok: true; matchedSecretIndex: number } | { ok: false } {
  if (params.secrets.length === 0) return { ok: false };

  for (let i = 0; i < params.secrets.length; i += 1) {
    const expected = signWebhookBody({
      body: params.body,
      timestamp: params.timestamp,
      secret: params.secrets[i]!,
    });
    if (safeHexEqual(expected, params.signature)) {
      return { ok: true, matchedSecretIndex: i };
    }
  }
  return { ok: false };
}

export function assertWebhookTimestamp(
  timestampRaw: string | undefined,
  maxSkewSeconds = DEFAULT_MAX_SKEW_SECONDS,
): number {
  if (!timestampRaw) {
    throw new AppError("WEBHOOK_TIMESTAMP_MISSING", "Webhook timestamp missing", 401);
  }
  const ts = Number(timestampRaw);
  if (!Number.isFinite(ts) || ts <= 0) {
    throw new AppError("WEBHOOK_TIMESTAMP_INVALID", "Webhook timestamp invalid", 401);
  }
  // Accept seconds or milliseconds
  const seconds = ts > 1_000_000_000_000 ? Math.floor(ts / 1000) : Math.floor(ts);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - seconds) > maxSkewSeconds) {
    throw new AppError("WEBHOOK_TIMESTAMP_SKEW", "Webhook timestamp outside allowed window", 401);
  }
  return seconds;
}

function pruneReplayCache(now: number): void {
  for (const [key, expiresAt] of replayCache) {
    if (expiresAt <= now) replayCache.delete(key);
  }
}

export function assertNotReplay(params: {
  provider: string;
  eventId: string;
  ttlMs?: number;
}): void {
  const now = Date.now();
  pruneReplayCache(now);
  const key = `${params.provider}:${params.eventId}`;
  const existing = replayCache.get(key);
  if (existing && existing > now) {
    throw new AppError("WEBHOOK_REPLAY", "Webhook event already processed", 409);
  }
  replayCache.set(key, now + (params.ttlMs ?? DEFAULT_REPLAY_TTL_MS));
}

/** Test helper — clear replay cache between cases. */
export function clearWebhookReplayCache(): void {
  replayCache.clear();
}

/**
 * Full webhook verification pipeline.
 * Fail-closed: missing secrets always reject (including stub providers).
 */
export function verifyWebhookRequest(
  input: VerifyWebhookInput,
): VerifyWebhookResult {
  return withSpanSync("webhook.verify", { provider: input.provider }, () => {
    const headers = normalizeHeaders(input.headers);
    const secretSet = resolveWebhookSecrets(input.secrets);
    const signature = readSignature(headers);
    const timestampRaw = headers[WEBHOOK_HEADERS.timestamp];
    const eventId =
      headers[WEBHOOK_HEADERS.eventId] ??
      headers["x-request-id"] ??
      headers["idempotency-key"];

    const auditBase = {
      span: "webhook.verify",
      provider: input.provider,
      hasSignature: Boolean(signature),
      hasTimestamp: Boolean(timestampRaw),
      hasEventId: Boolean(eventId),
      secretCount: secretSet.secrets.length,
    };

    try {
      if (secretSet.secrets.length === 0) {
        throw new AppError(
          "WEBHOOK_SECRET_MISSING",
          "Webhook signing secret not configured",
          401,
        );
      }
      if (!signature) {
        throw new AppError(
          "WEBHOOK_SIGNATURE_MISSING",
          "Webhook signature missing",
          401,
        );
      }
      if (!eventId) {
        throw new AppError(
          "WEBHOOK_EVENT_ID_MISSING",
          "Webhook event id missing",
          401,
        );
      }

      const timestamp = assertWebhookTimestamp(
        timestampRaw,
        input.maxSkewSeconds ?? DEFAULT_MAX_SKEW_SECONDS,
      );

      const hmac = verifyHmacAgainstSecrets({
        body: input.body,
        timestamp: String(timestampRaw),
        signature,
        secrets: secretSet.secrets,
      });
      if (!hmac.ok) {
        throw new AppError("INVALID_SIGNATURE", "Webhook signature invalid", 401);
      }

      assertNotReplay({
        provider: input.provider,
        eventId,
        ttlMs: input.replayTtlMs,
      });

      metrics.webhook({ provider: input.provider, outcome: "verified" });
      logger.info("Webhook verified", {
        ...auditBase,
        eventId,
        matchedSecretIndex: hmac.matchedSecretIndex,
        outcome: "accepted",
      });

      return {
        ok: true as const,
        eventId,
        timestamp,
        matchedSecretIndex: hmac.matchedSecretIndex,
      };
    } catch (error) {
      const code =
        error instanceof AppError ? error.code : "WEBHOOK_VERIFY_FAILED";
      if (code === "WEBHOOK_REPLAY") {
        metrics.webhook({
          provider: input.provider,
          outcome: "replay_blocked",
        });
      } else {
        metrics.webhook({ provider: input.provider, outcome: "rejected" });
      }
      logger.warn("Webhook verification failed", {
        ...auditBase,
        eventId: eventId ?? null,
        outcome: "rejected",
        code,
        errorCode: code,
      });
      void captureMessage(`Webhook rejected: ${code}`, {
        severity: "warning",
        tags: { provider: input.provider, errorCode: code },
      });
      throw error;
    }
  });
}

function withSpanSync<T>(
  name: "webhook.verify",
  attributes: Record<string, string | number | boolean | undefined>,
  fn: () => T,
): T {
  const span = startSpan(name, attributes);
  try {
    const result = fn();
    endSpan(span, "ok");
    return result;
  } catch (error) {
    endSpan(span, "error");
    throw error;
  }
}

/**
 * Build signed headers for tests / outbound stub delivery.
 */
export function buildSignedWebhookHeaders(params: {
  body: string;
  secret: string;
  eventId: string;
  timestamp?: number;
}): Record<string, string> {
  const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000);
  const signature = signWebhookBody({
    body: params.body,
    timestamp,
    secret: params.secret,
  });
  return {
    [WEBHOOK_HEADERS.signature]: signature,
    [WEBHOOK_HEADERS.timestamp]: String(timestamp),
    [WEBHOOK_HEADERS.eventId]: params.eventId,
  };
}
