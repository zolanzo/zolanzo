/**
 * Phase 4.2C — Trust Passport types.
 * Presentation only — never calculates trust scores.
 */

import type {
  TrustDimension,
  TrustProfile,
  TrustSubjectType,
  TrustTrend,
} from "@/lib/trust/types";

export const TRUST_PASSPORT_MODEL_VERSION = "trust-passport/1.0.0";

export type PassportVisibility = "private" | "organization" | "public";

export type PassportBadgeCode =
  | "verified_identity"
  | "trusted_worker"
  | "reliable_contributor"
  | "high_approval"
  | "long_term_member"
  | "zero_fraud"
  | "organization_trusted"
  | "verified_email"
  | "verified_phone";

export type PassportBadge = {
  code: PassportBadgeCode;
  label: string;
  description: string;
  earned: boolean;
  visibility: PassportVisibility[];
};

export type PassportAchievement = {
  code: string;
  label: string;
  description: string;
  earned: boolean;
};

export type PassportDimensionView = {
  dimension: TrustDimension;
  score: number;
  explanation: string;
};

export type PassportIdentitySection = {
  emailVerified: boolean;
  phoneVerified: boolean;
  governmentIdVerified: boolean;
  organizationVerified: boolean;
  verificationLevel: string;
  badges: PassportBadge[];
};

export type PassportTimelineEvent = {
  code: string;
  label: string;
  occurredAt: string;
  direction: "up" | "down" | "neutral";
  eventType: string | null;
};

export type TrustPassport = {
  subjectType: TrustSubjectType;
  subjectId: string;
  profilePublicId: string;
  displayName: string | null;
  visibility: PassportVisibility;
  identity: PassportIdentitySection;
  summary: {
    overallScore: number;
    band: string;
    trend: TrustTrend;
    trendDelta: number;
    lastUpdated: string;
  };
  dimensions: PassportDimensionView[];
  achievements: PassportAchievement[];
  badges: PassportBadge[];
  guidance: string[];
  timeline: PassportTimelineEvent[];
  reasons: string[];
  warnings: string[];
  modelVersion: string;
  generatedAt: string;
  sourceProfileVersion: number;
  advisoryOnly: true;
};

/** Evidence for passport builders — sourced from TrustProfile + signals, never recomputed scores. */
export type PassportBuildInput = {
  profile: TrustProfile;
  displayName?: string | null;
  identity: {
    emailVerified: boolean;
    phoneVerified: boolean;
    governmentIdVerified: boolean;
    organizationVerified: boolean;
  };
  stats: {
    assignmentsCompleted: number;
    accountAgeDays: number;
    approvalRate: number;
    organizationEndorsements: number;
    revisionRequestCount: number;
    fraudConfirmedCount: number;
    distinctOrganizations: number;
  };
  history?: Array<{
    overallScore: number;
    calculatedAt: string;
    trend: string;
  }>;
  events?: Array<{
    eventType: string;
    occurredAt: string;
    decayedWeight?: number;
  }>;
};
