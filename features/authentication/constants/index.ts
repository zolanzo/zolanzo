/**
 * Authentication architecture constants.
 */

export { AUTH_METHODS, type AuthMethodId } from "@/constants/auth-methods";

export const SESSION_POLICIES = {
  defaultTtlHours: 24 * 7,
  absoluteTtlDays: 30,
  idleTtlHours: 72,
  requireMfaForAdmin: true,
  maxConcurrentSessions: 20,
} as const;

export const AUTH_ENTITIES = [
  "AuthIdentity",
  "Session",
  "TrustedDevice",
  "MfaMethod",
  "RecoveryCode",
  "LoginHistory",
  "RiskSignal",
] as const;
