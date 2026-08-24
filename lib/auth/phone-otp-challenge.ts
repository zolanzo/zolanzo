/**
 * Server-owned Sendchamp OTP challenge.
 * The verification reference stays in an HMAC-signed httpOnly cookie —
 * never in API JSON. Existing phone_verifications.code_hash can also hold
 * the reference when the legacy table is available (no schema change).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { SENDCHAMP_OTP_EXPIRATION_MINUTES } from "@/lib/integrations/notifications/sendchamp/otp";

export const PHONE_OTP_COOKIE = "zolanzo_phone_otp";
export const PHONE_OTP_MAX_ATTEMPTS = 5;

export type PhoneOtpChallenge = {
  userId: string;
  phone: string;
  reference: string;
  exp: number;
  attempts: number;
};

function challengeSigningSecret(): string | null {
  const secret =
    process.env.CSRF_SECRET?.trim() ||
    process.env.WEBHOOK_SIGNING_SECRET?.trim();
  return secret && secret.length > 0 ? secret : null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createPhoneOtpChallenge(params: {
  userId: string;
  phone: string;
  reference: string;
  nowMs?: number;
}): PhoneOtpChallenge {
  const now = params.nowMs ?? Date.now();
  return {
    userId: params.userId,
    phone: params.phone,
    reference: params.reference,
    exp: now + SENDCHAMP_OTP_EXPIRATION_MINUTES * 60 * 1000,
    attempts: 0,
  };
}

export function encodePhoneOtpChallenge(
  challenge: PhoneOtpChallenge,
): string | null {
  const secret = challengeSigningSecret();
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify(challenge), "utf8").toString(
    "base64url",
  );
  return `${payload}.${signPayload(payload, secret)}`;
}

export function decodePhoneOtpChallenge(
  token: string | undefined | null,
): PhoneOtpChallenge | null {
  if (!token) return null;
  const secret = challengeSigningSecret();
  if (!secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = signPayload(payload, secret);
  if (!safeEqual(signature, expected)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as PhoneOtpChallenge;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.phone !== "string" ||
      typeof parsed.reference !== "string" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.attempts !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function phoneOtpChallengeExpired(
  challenge: PhoneOtpChallenge,
  nowMs = Date.now(),
): boolean {
  return nowMs >= challenge.exp;
}

export function phoneOtpCookieOptions(maxAgeSeconds = SENDCHAMP_OTP_EXPIRATION_MINUTES * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
