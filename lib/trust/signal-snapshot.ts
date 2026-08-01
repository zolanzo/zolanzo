/**
 * Empty / baseline trust signal snapshot helpers.
 */

import type { TrustSignalSnapshot } from "@/lib/trust/types";

export function emptyTrustSignalSnapshot(
  overrides: Partial<TrustSignalSnapshot> & Pick<TrustSignalSnapshot, "userId">,
): TrustSignalSnapshot {
  return {
    subjectKind: "worker",
    frozenAt: new Date().toISOString(),
    emailVerified: false,
    phoneVerified: false,
    governmentIdVerified: false,
    organizationVerified: false,
    addressVerified: false,
    assignmentsTotal: 0,
    assignmentsCompleted: 0,
    assignmentsAccepted: 0,
    assignmentsOffered: 0,
    avgResponseHours: null,
    deadlineMetRate: 0.7,
    attendanceRate: 0.85,
    reviewsDecided: 0,
    reviewsApproved: 0,
    revisionRequestCount: 0,
    avgReviewConfidence: null,
    positiveFeedbackCount: 0,
    fraudConfirmedCount: 0,
    policyViolationCount: 0,
    appealUpheldCount: 0,
    appealDeniedCount: 0,
    warningCount: 0,
    suspensionCount: 0,
    accountAgeDays: 0,
    distinctCampaigns: 0,
    distinctOrganizations: 0,
    organizationEndorsements: 0,
    verifiedRecommendations: 0,
    previousOverallScore: null,
    previousCalculatedAt: null,
    weightedEvents: [],
    ...overrides,
  };
}
