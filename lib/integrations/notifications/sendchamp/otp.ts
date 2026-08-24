/**
 * Sendchamp Verification OTP — create + confirm.
 * Docs:
 * https://sendchamp.readme.io/reference/send-otp-api
 * https://sendchamp.readme.io/reference/confirm-otp-api
 * https://sendchamp.readme.io/reference/get-wallet-balance-api
 */

import { sendchampCircuit } from "@/lib/integrations/notifications/sendchamp/circuit";
import {
  getSendchampSenderId,
  isSendchampConfigured,
  sendchampRequest,
} from "@/lib/integrations/notifications/sendchamp/client";
import { normalizeSendchampMsisdn } from "@/lib/integrations/notifications/sendchamp/msisdn";

export const SENDCHAMP_OTP_CHANNEL = "sms" as const;
export const SENDCHAMP_OTP_TOKEN_TYPE = "numeric" as const;
export const SENDCHAMP_OTP_LENGTH = 6;
export const SENDCHAMP_OTP_EXPIRATION_MINUTES = 20;

/**
 * Intended user-facing SMS. Official Sendchamp POST /verification/create
 * does not accept a custom message/template body — the provider generates
 * the SMS. Do not send this string as an invented API field.
 */
export const PHONE_VERIFICATION_SMS_COPY =
  "ZOLANZO: Your verification code is {{OTP}}. It expires in 20 minutes. Do not share this code with anyone.";

export function renderPhoneVerificationSmsCopy(otp: string): string {
  return PHONE_VERIFICATION_SMS_COPY.replaceAll("{{OTP}}", otp);
}

export type SendchampOtpFailureCode =
  | "not_configured"
  | "circuit_open"
  | "timeout"
  | "invalid"
  | "expired"
  | "rate_limited"
  | "rejected";

export type SendchampOtpCreateResult =
  | { ok: true; reference: string }
  | { ok: false; status: number; code: SendchampOtpFailureCode };

export type SendchampOtpConfirmResult =
  | { ok: true }
  | { ok: false; status: number; code: SendchampOtpFailureCode };

export type SendchampProbeResult =
  | { ok: true; status: number }
  | { ok: false; status: number; code: SendchampOtpFailureCode };

type SendchampOtpCreateData = {
  reference?: string;
  status?: string;
  token?: string;
};

function classifySendchampFailure(
  status: number,
  message: string,
): SendchampOtpFailureCode {
  const text = message.toLowerCase();
  if (status === 0 && /timeout/i.test(message)) return "timeout";
  if (status === 429 || text.includes("too many")) return "rate_limited";
  if (
    text.includes("expir") ||
    text.includes("timeout") ||
    text.includes("no longer valid")
  ) {
    return "expired";
  }
  if (
    text.includes("invalid token") ||
    text.includes("incorrect") ||
    text.includes("invalid code") ||
    text.includes("invalid otp")
  ) {
    return "invalid";
  }
  if (status === 401 || status === 403) return "rejected";
  return "rejected";
}

export function createSendchampOtpRequestBody(params: {
  mobileNumber: string;
  firstName?: string;
  sender?: string;
}): Record<string, unknown> {
  // Documented Sendchamp fields only. No custom SMS body parameter exists.
  return {
    channel: SENDCHAMP_OTP_CHANNEL,
    sender: params.sender ?? getSendchampSenderId(),
    token_type: SENDCHAMP_OTP_TOKEN_TYPE,
    token_length: SENDCHAMP_OTP_LENGTH,
    expiration_time: SENDCHAMP_OTP_EXPIRATION_MINUTES,
    customer_mobile_number: normalizeSendchampMsisdn(params.mobileNumber),
    meta_data: {
      first_name: params.firstName?.trim() || "User",
    },
  };
}

export function createSendchampOtpConfirmBody(params: {
  verificationReference: string;
  verificationCode: string;
}): Record<string, unknown> {
  return {
    verification_reference: params.verificationReference,
    verification_code: params.verificationCode,
  };
}

export async function createSendchampOtp(params: {
  mobileNumber: string;
  firstName?: string;
  fetchImpl?: typeof fetch;
}): Promise<SendchampOtpCreateResult> {
  if (!isSendchampConfigured()) {
    return { ok: false, status: 0, code: "not_configured" };
  }
  if (!sendchampCircuit.allow()) {
    return { ok: false, status: 0, code: "circuit_open" };
  }

  const result = await sendchampRequest<SendchampOtpCreateData>({
    method: "POST",
    path: "/verification/create",
    body: createSendchampOtpRequestBody({
      mobileNumber: params.mobileNumber,
      firstName: params.firstName,
    }),
    fetchImpl: params.fetchImpl,
  });

  if (!result.ok) {
    sendchampCircuit.recordFailure();
    return {
      ok: false,
      status: result.status,
      code: classifySendchampFailure(result.status, result.message),
    };
  }

  const reference = result.data.reference?.trim();
  if (!reference) {
    sendchampCircuit.recordFailure();
    return { ok: false, status: result.status, code: "rejected" };
  }

  sendchampCircuit.recordSuccess();
  return { ok: true, reference };
}

export async function confirmSendchampOtp(params: {
  verificationReference: string;
  verificationCode: string;
  fetchImpl?: typeof fetch;
}): Promise<SendchampOtpConfirmResult> {
  if (!isSendchampConfigured()) {
    return { ok: false, status: 0, code: "not_configured" };
  }
  if (!sendchampCircuit.allow()) {
    return { ok: false, status: 0, code: "circuit_open" };
  }

  const result = await sendchampRequest<Record<string, unknown>>({
    method: "POST",
    path: "/verification/confirm",
    body: createSendchampOtpConfirmBody({
      verificationReference: params.verificationReference,
      verificationCode: params.verificationCode,
    }),
    fetchImpl: params.fetchImpl,
  });

  if (!result.ok) {
    sendchampCircuit.recordFailure();
    return {
      ok: false,
      status: result.status,
      code: classifySendchampFailure(result.status, result.message),
    };
  }

  sendchampCircuit.recordSuccess();
  return { ok: true };
}

export async function probeSendchampApi(params?: {
  fetchImpl?: typeof fetch;
}): Promise<SendchampProbeResult> {
  if (!isSendchampConfigured()) {
    return { ok: false, status: 0, code: "not_configured" };
  }

  const result = await sendchampRequest<Record<string, unknown>>({
    method: "POST",
    path: "/wallet/wallet_balance",
    fetchImpl: params?.fetchImpl,
  });

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      code: classifySendchampFailure(result.status, result.message),
    };
  }

  return { ok: true, status: result.status };
}
