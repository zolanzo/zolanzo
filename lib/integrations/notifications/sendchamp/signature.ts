/**
 * Sendchamp webhook signature verification.
 * Prefer SENDCHAMP_WEBHOOK_SECRET; falls back to WEBHOOK_SIGNING_SECRET.
 * Accepts platform HMAC (timestamp.body) or raw body HMAC (x-sendchamp-signature).
 */

import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/api/response";
import {
  assertNotReplay,
  verifyWebhookRequest,
} from "@/lib/security/webhook-auth";
import { getSendchampWebhookSecret } from "@/lib/integrations/notifications/sendchamp/client";

function headerValue(
  headers: Record<string, string>,
  name: string,
): string | null {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && value?.trim()) return value.trim();
  }
  return null;
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return nodeTimingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function computeSendchampBodyHmac(
  body: string,
  secret: string,
): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

export function verifySendchampWebhook(params: {
  headers: Record<string, string>;
  body: string;
  eventId: string;
  secret?: string | null;
}): { ok: true } | { ok: false; reason: string } {
  const secret = params.secret ?? getSendchampWebhookSecret();
  if (!secret) {
    return { ok: false, reason: "SENDCHAMP_WEBHOOK_SECRET missing" };
  }

  // Prefer platform webhook-auth when timestamp + signature present.
  const hasPlatformTs =
    Boolean(headerValue(params.headers, "x-webhook-timestamp")) ||
    Boolean(headerValue(params.headers, "x-sendchamp-timestamp"));
  if (hasPlatformTs) {
    try {
      verifyWebhookRequest({
        provider: "sendchamp",
        headers: params.headers,
        body: params.body,
        secrets: { secrets: [secret] },
      });
      return { ok: true };
    } catch (error) {
      if (error instanceof AppError && error.code === "WEBHOOK_REPLAY") {
        throw error;
      }
      // Fall through to body HMAC
    }
  }

  const signature =
    headerValue(params.headers, "x-sendchamp-signature") ||
    headerValue(params.headers, "x-webhook-signature");
  if (!signature) {
    return { ok: false, reason: "signature_missing" };
  }

  const expected = computeSendchampBodyHmac(params.body, secret);
  const provided = signature.replace(/^sha256=/i, "").trim();
  if (!safeEqual(expected, provided) && !safeEqual(expected, signature)) {
    return { ok: false, reason: "invalid_signature" };
  }

  try {
    assertNotReplay({ provider: "sendchamp", eventId: params.eventId });
  } catch (error) {
    if (error instanceof AppError && error.code === "WEBHOOK_REPLAY") {
      throw error;
    }
    return { ok: false, reason: "replay_check_failed" };
  }

  return { ok: true };
}
