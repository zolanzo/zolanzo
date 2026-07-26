/**
 * Trust & verification architecture — scores, badges, levels.
 */

export const VERIFICATION_LEVELS = [
  "none",
  "email",
  "phone",
  "identity",
  "kyc",
  "business",
] as const;

export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

export const VERIFICATION_LEVEL_RANK: Record<VerificationLevel, number> = {
  none: 0,
  email: 10,
  phone: 20,
  identity: 40,
  kyc: 60,
  business: 80,
};

export const TRUST_BADGES = [
  "verified_email",
  "verified_phone",
  "verified_identity",
  "verified_worker",
  "verified_employer",
  "verified_business",
  "verified_payment_method",
] as const;

export type TrustBadge = (typeof TRUST_BADGES)[number];

export const TRUST_SCORE_BANDS = [
  { id: "new", min: 0, max: 19, label: "New" },
  { id: "building", min: 20, max: 49, label: "Building" },
  { id: "established", min: 50, max: 74, label: "Established" },
  { id: "trusted", min: 75, max: 89, label: "Trusted" },
  { id: "exemplary", min: 90, max: 100, label: "Exemplary" },
] as const;

/**
 * Inputs that influence trust score (design — weights tuned later).
 */
export const TRUST_SIGNAL_KEYS = [
  "email_verified",
  "phone_verified",
  "kyc_approved",
  "payment_method_verified",
  "assignment_completion_rate",
  "submission_approval_rate",
  "dispute_rate_inverse",
  "account_age_days",
  "moderation_strikes_inverse",
  "org_business_verified",
  "device_trust",
  "geo_consistency",
] as const;

export type TrustSignalKey = (typeof TRUST_SIGNAL_KEYS)[number];
