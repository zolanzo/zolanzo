/**
 * Canonical phone verification — Sendchamp OTP behind Zolanzo's existing
 * auth/session + Prisma phoneVerifiedAt. Does not silently mark verified.
 */

import "server-only";

import { cookies } from "next/headers";
import { AppError } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/write";
import {
  decodePhoneOtpChallenge,
  encodePhoneOtpChallenge,
  createPhoneOtpChallenge,
  PHONE_OTP_COOKIE,
  PHONE_OTP_MAX_ATTEMPTS,
  phoneOtpChallengeExpired,
  phoneOtpCookieOptions,
  type PhoneOtpChallenge,
} from "@/lib/auth/phone-otp-challenge";
import type { AuthContext } from "@/lib/auth/session";
import {
  confirmSendchampOtp,
  createSendchampOtp,
  SENDCHAMP_OTP_EXPIRATION_MINUTES,
  SENDCHAMP_OTP_LENGTH,
} from "@/lib/integrations/notifications/sendchamp/otp";
import { isNormalizedMsisdn, normalizeSendchampMsisdn } from "@/lib/integrations/notifications/sendchamp/msisdn";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/observability/logger";
import { RATE_LIMIT_PRESETS, rateLimit } from "@/lib/security/rate-limit";
import { isServiceRoleConfigured } from "@/lib/validation/env";

export const PHONE_OTP_USER_MESSAGES = {
  sendFailed: "Unable to send verification code. Please try again.",
  incorrect: "Incorrect verification code.",
  expired: "Verification code expired. Request a new one.",
  rateLimited: "Too many attempts. Please try again later.",
  unauthenticated: "Please sign in to verify your phone number.",
  invalidPhone: "Please enter a valid mobile phone number.",
  alreadyVerified: "Phone verified",
} as const;

function userMessageForOtpFailure(
  code: "not_configured" | "circuit_open" | "timeout" | "invalid" | "expired" | "rate_limited" | "rejected",
): string {
  if (code === "invalid") return PHONE_OTP_USER_MESSAGES.incorrect;
  if (code === "expired") return PHONE_OTP_USER_MESSAGES.expired;
  if (code === "rate_limited") return PHONE_OTP_USER_MESSAGES.rateLimited;
  return PHONE_OTP_USER_MESSAGES.sendFailed;
}

function errorForOtpFailure(
  code: "not_configured" | "circuit_open" | "timeout" | "invalid" | "expired" | "rate_limited" | "rejected",
): AppError {
  const message = userMessageForOtpFailure(code);
  if (code === "rate_limited") {
    return new AppError("RATE_LIMITED", message, 429);
  }
  if (code === "invalid") {
    return new AppError("PHONE_OTP_INVALID", message, 400);
  }
  if (code === "expired") {
    return new AppError("PHONE_OTP_EXPIRED", message, 400);
  }
  return new AppError("PHONE_OTP_FAILED", message, 503);
}

async function enforceOtpRateLimit(key: string, preset = RATE_LIMIT_PRESETS.otp) {
  const result = await rateLimit(key, preset);
  if (!result.success) {
    throw new AppError(
      "RATE_LIMITED",
      PHONE_OTP_USER_MESSAGES.rateLimited,
      429,
    );
  }
}

async function readChallengeCookie(): Promise<PhoneOtpChallenge | null> {
  const store = await cookies();
  return decodePhoneOtpChallenge(store.get(PHONE_OTP_COOKIE)?.value);
}

async function writeChallengeCookie(challenge: PhoneOtpChallenge): Promise<void> {
  const token = encodePhoneOtpChallenge(challenge);
  if (!token) {
    throw new AppError(
      "PHONE_OTP_FAILED",
      PHONE_OTP_USER_MESSAGES.sendFailed,
      503,
    );
  }
  const store = await cookies();
  store.set(PHONE_OTP_COOKIE, token, phoneOtpCookieOptions());
}

async function clearChallengeCookie(): Promise<void> {
  const store = await cookies();
  store.set(PHONE_OTP_COOKIE, "", { ...phoneOtpCookieOptions(0), maxAge: 0 });
}

async function persistLegacyChallenge(params: {
  authSubject: string;
  phone: string;
  reference: string;
}): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const admin = createSupabaseAdminClient();
    const expiresAt = new Date(
      Date.now() + SENDCHAMP_OTP_EXPIRATION_MINUTES * 60 * 1000,
    ).toISOString();
    // Legacy table: code_hash holds the Sendchamp reference (server-only).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("phone_verifications") as any).insert({
      user_id: params.authSubject,
      phone: params.phone,
      code_hash: params.reference,
      expires_at: expiresAt,
      attempts: 0,
    });
  } catch {
    // Cookie is the canonical challenge store; legacy row is best-effort.
  }
}

async function markLegacyProfileVerified(params: {
  authSubject: string;
  phone: string;
}): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("profiles") as any)
      .update({
        phone: params.phone,
        phone_verified: true,
      })
      .eq("id", params.authSubject);
  } catch {
    // Prisma User.phoneVerifiedAt is the product source of truth.
  }
}

export function isValidPhoneInput(phone: string): boolean {
  return isNormalizedMsisdn(phone);
}

export async function requestPhoneOtp(params: {
  ctx: AuthContext;
  phone: string;
  ip?: string | null;
}): Promise<{ sent: true } | { alreadyVerified: true }> {
  const phone = normalizeSendchampMsisdn(params.phone);
  if (!isValidPhoneInput(phone)) {
    throw new AppError(
      "INVALID_PHONE",
      PHONE_OTP_USER_MESSAGES.invalidPhone,
      400,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: params.ctx.user.id },
    select: {
      id: true,
      phone: true,
      phoneVerifiedAt: true,
      profile: { select: { displayName: true } },
    },
  });
  if (!user) {
    throw new AppError("UNAUTHENTICATED", PHONE_OTP_USER_MESSAGES.unauthenticated, 401);
  }

  if (user.phoneVerifiedAt && user.phone === phone) {
    return { alreadyVerified: true };
  }

  await enforceOtpRateLimit(`otp:send:user:${user.id}`);
  await enforceOtpRateLimit(`otp:send:phone:${phone}`);
  if (params.ip) {
    await enforceOtpRateLimit(`otp:send:ip:${params.ip}`);
  }

  const created = await createSendchampOtp({
    mobileNumber: phone,
    firstName: user.profile?.displayName ?? undefined,
  });
  if (!created.ok) {
    logger.warn("Sendchamp OTP create failed", {
      span: "phone.otp.create",
      code: created.code,
      status: created.status,
    });
    throw errorForOtpFailure(created.code);
  }

  const challenge = createPhoneOtpChallenge({
    userId: user.id,
    phone,
    reference: created.reference,
  });
  await writeChallengeCookie(challenge);
  await persistLegacyChallenge({
    authSubject: params.ctx.supabaseUserId,
    phone,
    reference: created.reference,
  });

  return { sent: true };
}

export async function confirmPhoneOtp(params: {
  ctx: AuthContext;
  phone: string;
  code: string;
  ip?: string | null;
}): Promise<{ verified: true }> {
  const phone = normalizeSendchampMsisdn(params.phone);
  const code = params.code.replace(/\D/g, "");
  if (code.length !== SENDCHAMP_OTP_LENGTH) {
    throw new AppError(
      "PHONE_OTP_INVALID",
      PHONE_OTP_USER_MESSAGES.incorrect,
      400,
    );
  }

  await enforceOtpRateLimit(
    `otp:confirm:user:${params.ctx.user.id}`,
    RATE_LIMIT_PRESETS.strict,
  );

  const challenge = await readChallengeCookie();
  if (!challenge || challenge.userId !== params.ctx.user.id) {
    throw new AppError(
      "PHONE_OTP_EXPIRED",
      PHONE_OTP_USER_MESSAGES.expired,
      400,
    );
  }
  if (challenge.phone !== phone) {
    throw new AppError(
      "PHONE_OTP_INVALID",
      PHONE_OTP_USER_MESSAGES.incorrect,
      400,
    );
  }
  if (phoneOtpChallengeExpired(challenge)) {
    await clearChallengeCookie();
    throw new AppError(
      "PHONE_OTP_EXPIRED",
      PHONE_OTP_USER_MESSAGES.expired,
      400,
    );
  }
  if (challenge.attempts >= PHONE_OTP_MAX_ATTEMPTS) {
    throw new AppError(
      "RATE_LIMITED",
      PHONE_OTP_USER_MESSAGES.rateLimited,
      429,
    );
  }

  const taken = await prisma.user.findFirst({
    where: {
      phone,
      NOT: { id: params.ctx.user.id },
    },
    select: { id: true },
  });
  if (taken) {
    throw new AppError(
      "PHONE_OTP_FAILED",
      PHONE_OTP_USER_MESSAGES.sendFailed,
      409,
    );
  }

  const confirmed = await confirmSendchampOtp({
    verificationReference: challenge.reference,
    verificationCode: code,
  });
  if (!confirmed.ok) {
    const next: PhoneOtpChallenge = {
      ...challenge,
      attempts: challenge.attempts + 1,
    };
    await writeChallengeCookie(next);
    logger.warn("Sendchamp OTP confirm failed", {
      span: "phone.otp.confirm",
      code: confirmed.code,
      status: confirmed.status,
    });
    throw errorForOtpFailure(confirmed.code);
  }

  try {
    await prisma.user.update({
      where: { id: params.ctx.user.id },
      data: {
        phone,
        phoneVerifiedAt: new Date(),
      },
    });
  } catch (error) {
    logger.warn("Phone verified at provider but profile update failed", {
      span: "phone.otp.persist",
      err:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: String(error) },
    });
    throw new AppError(
      "PHONE_OTP_FAILED",
      PHONE_OTP_USER_MESSAGES.sendFailed,
      503,
    );
  }

  await clearChallengeCookie();
  await markLegacyProfileVerified({
    authSubject: params.ctx.supabaseUserId,
    phone,
  });
  await writeAuditLog({
    actorUserId: params.ctx.user.id,
    action: "phone.verified",
    resourceType: "user",
    resourceId: params.ctx.user.id,
    ip: params.ip,
  });

  return { verified: true };
}
