/**
 * Trust Passport — presentation layer over TrustProfileService.
 */

export type {
  PassportVisibility,
  PassportBadge,
  PassportBadgeCode,
  PassportAchievement,
  PassportDimensionView,
  PassportIdentitySection,
  PassportTimelineEvent,
  TrustPassport,
  PassportBuildInput,
} from "@/lib/trust/passport/types";

export { TRUST_PASSPORT_MODEL_VERSION } from "@/lib/trust/passport/types";

export {
  isTrustPassportEnabled,
  isTrustBadgesEnabled,
  isTrustTimelineEnabled,
} from "@/lib/trust/passport/config";

export { buildPassportBadges, earnedBadgeCodes } from "@/lib/trust/passport/badge-engine";
export { buildPassportAchievements } from "@/lib/trust/passport/achievement-engine";
export { buildPassportGuidance } from "@/lib/trust/passport/guidance-builder";
export { buildPassportTimeline } from "@/lib/trust/passport/timeline-builder";
export { applyPassportVisibility } from "@/lib/trust/passport/visibility-filter";
export { buildTrustPassport } from "@/lib/trust/passport/passport-builder";

export {
  getPassportTelemetrySnapshot,
  resetPassportTelemetryForTests,
  recordPassportGeneration,
} from "@/lib/trust/passport/passport-telemetry";
