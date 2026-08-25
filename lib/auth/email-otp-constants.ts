export const EMAIL_OTP_PURPOSE = {
  emailVerification: "email_verification",
  pinReset: "pin_reset",
} as const;

export type EmailOtpPurpose =
  (typeof EMAIL_OTP_PURPOSE)[keyof typeof EMAIL_OTP_PURPOSE];

export const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
export const EMAIL_OTP_MAX_ATTEMPTS = 5;

export type EmailOtpFailureReason =
  | "no_active"
  | "expired"
  | "invalid"
  | "already_used"
  | "already_verified"
  | "too_many"
  | "need_new_code";

export const EMAIL_OTP_USER_MESSAGES = {
  noActive: "No verification request found for this email.",
  expired: "Code expired. Please request a new code.",
  invalid: "That code is incorrect. Please try again.",
  alreadyUsed: "That verification code has already been used. Please request a new code.",
  alreadyVerified: "This email is already verified. You can log in.",
  tooManyAttempts: "Too many attempts. Please request a new code.",
  needNewCode: "Please request a new code.",
  sendFailed: "We couldn't send the verification email. Please try again.",
  generic: "Verification could not be completed. Please try again.",
} as const;

export function messageForOtpFailure(reason: EmailOtpFailureReason): string {
  switch (reason) {
    case "expired":
      return EMAIL_OTP_USER_MESSAGES.expired;
    case "invalid":
      return EMAIL_OTP_USER_MESSAGES.invalid;
    case "already_used":
      return EMAIL_OTP_USER_MESSAGES.alreadyUsed;
    case "already_verified":
      return EMAIL_OTP_USER_MESSAGES.alreadyVerified;
    case "too_many":
      return EMAIL_OTP_USER_MESSAGES.tooManyAttempts;
    case "need_new_code":
      return EMAIL_OTP_USER_MESSAGES.needNewCode;
    default:
      return EMAIL_OTP_USER_MESSAGES.noActive;
  }
}
