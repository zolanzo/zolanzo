/**
 * Bridge helpers — compute overall trust from common worker stats.
 * Used by Match Engine / Worker Copilot to share one formula.
 */

import { calculateTrustScores } from "@/lib/trust/calculator";
import { isTrustEngineEnabled } from "@/lib/trust/config";
import { emptyTrustSignalSnapshot } from "@/lib/trust/signal-snapshot";

export type LegacyTrustInputs = {
  userId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  approvalRate: number;
  completionRate: number;
  completedAssignments: number;
  totalAssignments: number;
  reviewsDecided?: number;
  reviewsApproved?: number;
  accountAgeDays?: number;
  distinctCampaigns?: number;
  distinctOrganizations?: number;
  suspended?: boolean;
};

/**
 * Prefer Trust Engine when enabled; otherwise keep prior heuristic.
 */
export function resolveOverallTrustScore(input: LegacyTrustInputs): number {
  if (!isTrustEngineEnabled()) {
    return Math.min(
      100,
      Math.round(
        40 +
          (input.emailVerified ? 10 : 0) +
          (input.phoneVerified ? 10 : 0) +
          input.approvalRate * 25 +
          input.completionRate * 15,
      ),
    );
  }

  const reviewsDecided =
    input.reviewsDecided ??
    (input.approvalRate > 0
      ? Math.max(1, Math.round(input.completedAssignments || 10))
      : 0);
  const reviewsApproved =
    input.reviewsApproved ??
    Math.round(reviewsDecided * input.approvalRate);

  const snap = emptyTrustSignalSnapshot({
    userId: input.userId,
    emailVerified: input.emailVerified,
    phoneVerified: input.phoneVerified,
    assignmentsTotal: input.totalAssignments,
    assignmentsCompleted: input.completedAssignments,
    assignmentsAccepted: input.totalAssignments,
    assignmentsOffered: Math.max(input.totalAssignments, 1),
    deadlineMetRate: input.completionRate,
    attendanceRate: input.completionRate,
    reviewsDecided,
    reviewsApproved,
    accountAgeDays: input.accountAgeDays ?? 30,
    distinctCampaigns: input.distinctCampaigns ?? 1,
    distinctOrganizations: input.distinctOrganizations ?? 1,
    suspensionCount: input.suspended ? 1 : 0,
  });

  return calculateTrustScores(snap).overallScore;
}
