/**
 * Trust & Reputation Engine — platform capability (Phase 4.2A/B).
 *
 * Explainable, time-decayed, persistent trust scores.
 * Never mutates wallets, reviews, assignments, or other business tables.
 */

export type {
  TrustDimension,
  TrustTrend,
  TrustEventType,
  TrustWeightedEvent,
  TrustSignalSnapshot,
  TrustDimensionScore,
  TrustProfile,
  TrustHealthCounters,
  TrustSubjectType,
  TrustEventStatus,
} from "@/lib/trust/types";

export { TRUST_ENGINE_MODEL_VERSION } from "@/lib/trust/types";

export {
  isTrustEngineEnabled,
  isTrustExplainabilityEnabled,
  isTrustTrendsEnabled,
  getTrustDecayHalfLifeDays,
} from "@/lib/trust/config";

export {
  trustDecayFactor,
  ageDaysSince,
  applyDecayToWeight,
} from "@/lib/trust/time-decay";

export {
  TRUST_DIMENSION_WEIGHTS,
  calculateTrustScores,
  calculateIdentityScore,
  calculateReliabilityScore,
  calculateQualityScore,
  calculateBehaviorScore,
  calculateExperienceScore,
  calculateReputationScore,
  calculateOverallScore,
} from "@/lib/trust/calculator";

export { analyzeTrustTrend } from "@/lib/trust/trend-analyzer";
export { buildTrustExplanation, bandForScore } from "@/lib/trust/explanation-builder";

export {
  appendTrustEvent,
  toWeightedTrustEvent,
  listTrustEvents,
  refreshDecayedEvents,
  defaultWeightForTrustEvent,
  applyEventToSignalCounters,
  resetTrustEventLedgerForTests,
  type IncomingTrustEvent,
} from "@/lib/trust/event-processor";

export {
  buildTrustProfileFromSnapshot,
  trustEngine,
  getOrCreateTrustPublicId,
  resetTrustPublicIdsForTests,
  type TrustEngine,
} from "@/lib/trust/trust-engine";

export {
  recalculateTrustProfile,
  getTrustProfile,
  getCachedTrustProfile,
  processTrustEvent,
  processTrustEvents,
  cacheTrustBaseSignals,
  listCachedTrustProfiles,
  resetTrustProfileCacheForTests,
} from "@/lib/trust/profile-service";

export { emptyTrustSignalSnapshot } from "@/lib/trust/signal-snapshot";
export {
  resolveOverallTrustScore,
  type LegacyTrustInputs,
} from "@/lib/trust/legacy-bridge";

export {
  getTrustTelemetrySnapshot,
  resetTrustTelemetryForTests,
  recordTrustRecalculation,
  recordTrustEventProcessed,
  recordTrustEventFailed,
  recordTrustEventDeadLetter,
} from "@/lib/trust/telemetry";

export {
  isTrustPassportEnabled,
  isTrustBadgesEnabled,
  isTrustTimelineEnabled,
  buildTrustPassport,
  buildPassportBadges,
  earnedBadgeCodes,
  applyPassportVisibility,
  getPassportTelemetrySnapshot,
  resetPassportTelemetryForTests,
  TRUST_PASSPORT_MODEL_VERSION,
  type TrustPassport,
  type PassportVisibility,
  type PassportBuildInput,
} from "@/lib/trust/passport";
