/**
 * Resend (Svix) webhook signature verification.
 * https://resend.com/docs/webhooks/verify-webhooks-requests
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/api/response";
import { assertNotReplay } from "@/lib/security/webhook-auth";
import { getResendWebhookSecret } from "@/lib/integrations/notifications/resend/client";

const MAX_SKEW_SECONDS = 300;

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

function decodeWhsec(secret: string): Buffer {
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  return Buffer.from(raw, "base64");
}

export function computeResendSignature(
  body: string,
  msgId: string,
  timestamp: string,
  secret: string,
): string {
  const key = decodeWhsec(secret);
  const toSign = `${msgId}.${timestamp}.${body}`;
  return createHmac("sha256", key).update(toSign, "utf8").digest("base64");
}

function signaturesMatch(expected: string, header: string): boolean {
  const parts = header.split(" ");
  for (const part of parts) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(sig);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    } catch {
      // continue
    }
  }
  return false;
}

/**
 * Verify Resend/Svix webhook. Throws AppError on replay.
 */
export function verifyResendWebhook(params: {
  headers: Record<string, string>;
  body: string;
  secret?: string | null;
}): { ok: true; eventId: string; timestamp: string } | { ok: false; reason: string } {
  const secret = params.secret ?? getResendWebhookSecret();
  if (!secret) {
    return { ok: false, reason: "RESEND_WEBHOOK_SECRET missing" };
  }

  const msgId = headerValue(params.headers, "svix-id");
  const timestamp = headerValue(params.headers, "svix-timestamp");
  const signature = headerValue(params.headers, "svix-signature");

  if (!msgId || !timestamp || !signature) {
    return { ok: false, reason: "svix_headers_missing" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || ts <= 0) {
    return { ok: false, reason: "timestamp_invalid" };
  }
  const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skew > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "timestamp_skew" };
  }

  const expected = computeResendSignature(
    params.body,
    msgId,
    timestamp,
    secret,
  );
  if (!signaturesMatch(expected, signature)) {
    return { ok: false, reason: "invalid_signature" };
  }

  try {
    assertNotReplay({ provider: "resend", eventId: msgId });
  } catch (error) {
    if (error instanceof AppError && error.code === "WEBHOOK_REPLAY") {
      throw error;
    }
    return { ok: false, reason: "replay_check_failed" };
  }

  return { ok: true, eventId: msgId, timestamp };
}
