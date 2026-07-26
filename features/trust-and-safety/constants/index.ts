/**
 * Trust & safety architecture constants (extends shared trust tokens).
 */

export {
  TRUST_BADGES,
  TRUST_SCORE_BANDS,
  TRUST_SIGNAL_KEYS,
  VERIFICATION_LEVELS,
  VERIFICATION_LEVEL_RANK,
  type TrustBadge,
  type TrustSignalKey,
  type VerificationLevel,
} from "@/constants/trust";

export const TRUST_ENTITIES = [
  "TrustScore",
  "TrustSignal",
  "ReputationSnapshot",
  "BadgeGrant",
] as const;
