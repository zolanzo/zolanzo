/**
 * SignatureService — HMAC-SHA256 delivery signatures.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const WEBHOOK_SIGNATURE_HEADERS = {
  event: "X-Zolanzo-Event",
  timestamp: "X-Zolanzo-Timestamp",
  signature: "X-Zolanzo-Signature",
  delivery: "X-Zolanzo-Delivery",
} as const;

export function signWebhookPayload(params: {
  secret: string;
  timestamp: string;
  body: string;
}): string {
  const base = `${params.timestamp}.${params.body}`;
  const digest = createHmac("sha256", params.secret)
    .update(base)
    .digest("hex");
  return `v1=${digest}`;
}

export function verifyWebhookSignature(params: {
  secret: string;
  timestamp: string;
  body: string;
  signatureHeader: string;
}): boolean {
  const expected = signWebhookPayload(params);
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildSignedHeaders(params: {
  secret: string;
  event: string;
  deliveryId: string;
  body: string;
  timestamp?: string;
}): Record<string, string> {
  const timestamp = params.timestamp ?? String(Math.floor(Date.now() / 1000));
  const signature = signWebhookPayload({
    secret: params.secret,
    timestamp,
    body: params.body,
  });
  return {
    [WEBHOOK_SIGNATURE_HEADERS.event]: params.event,
    [WEBHOOK_SIGNATURE_HEADERS.timestamp]: timestamp,
    [WEBHOOK_SIGNATURE_HEADERS.signature]: signature,
    [WEBHOOK_SIGNATURE_HEADERS.delivery]: params.deliveryId,
    "Content-Type": "application/json",
    "User-Agent": "Zolanzo-Webhooks/1.0",
  };
}

export const SignatureService = {
  sign: signWebhookPayload,
  verify: verifyWebhookSignature,
  headers: buildSignedHeaders,
};
