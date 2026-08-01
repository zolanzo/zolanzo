/**
 * Paystack webhook signature verification (HMAC-SHA512 of raw body).
 * Replay protection uses Paystack event id after signature verifies.
 */

import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/api/response";
import { assertNotReplay } from "@/lib/security/webhook-auth";
import { getPaystackSecretKey } from "@/lib/integrations/payments/paystack/client";

const MAX_EVENT_AGE_SECONDS = 15 * 60;

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return nodeTimingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function computePaystackSignature(
  body: string,
  secret: string,
): string {
  return createHmac("sha512", secret).update(body, "utf8").digest("hex");
}

export function readPaystackSignature(
  headers: Record<string, string>,
): string | null {
  const entries = Object.entries(headers);
  for (const [key, value] of entries) {
    if (key.toLowerCase() === "x-paystack-signature" && value?.trim()) {
      return value.trim();
    }
  }
  return null;
}

/**
 * Verify Paystack webhook: signature → event id replay → optional created_at skew.
 */
export function verifyPaystackWebhook(params: {
  headers: Record<string, string>;
  body: string;
  eventId: string;
  occurredAtIso?: string | null;
  secretKey?: string | null;
}): { ok: true } | { ok: false; reason: string } {
  const secret = params.secretKey ?? getPaystackSecretKey();
  if (!secret) {
    return { ok: false, reason: "PAYSTACK_SECRET_KEY missing" };
  }

  const signature = readPaystackSignature(params.headers);
  if (!signature) {
    return { ok: false, reason: "signature_missing" };
  }

  const expected = computePaystackSignature(params.body, secret);
  const provided = signature.toLowerCase();
  if (!safeEqualHex(expected, provided)) {
    return { ok: false, reason: "invalid_signature" };
  }

  if (!params.eventId) {
    return { ok: false, reason: "event_id_missing" };
  }

  try {
    assertNotReplay({
      provider: "paystack",
      eventId: params.eventId,
    });
  } catch (error) {
    if (error instanceof AppError && error.code === "WEBHOOK_REPLAY") {
      throw error;
    }
    return { ok: false, reason: "replay_check_failed" };
  }

  if (params.occurredAtIso) {
    const occurred = Date.parse(params.occurredAtIso);
    if (Number.isFinite(occurred)) {
      const skewSec = Math.abs(Date.now() - occurred) / 1000;
      if (skewSec > MAX_EVENT_AGE_SECONDS) {
        return { ok: false, reason: "timestamp_skew" };
      }
    }
  }

  return { ok: true };
}
