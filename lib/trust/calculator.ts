/**
 * TrustCalculator — dimension scores from a frozen signal snapshot.
 */

import type {
  TrustDimension,
  TrustDimensionScore,
  TrustSignalSnapshot,
} from "@/lib/trust/types";

function clamp(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function rate(num: number, den: number, fallback: number): number {
  if (den <= 0) return fallback;
  return num / den;
}

/** Dimension weights for overall score (must sum to 1). */
export const TRUST_DIMENSION_WEIGHTS: Record<TrustDimension, number> = {
  identity: 0.2,
  reliability: 0.2,
  quality: 0.25,
  behavior: 0.15,
  experience: 0.1,
  reputation: 0.1,
};

export function calculateIdentityScore(
  snap: TrustSignalSnapshot,
): TrustDimensionScore {
  const contributors: TrustDimensionScore["contributors"] = [];
  let score = 0;
  if (snap.emailVerified) {
    score += 25;
    contributors.push({
      code: "email_verified",
      label: "Email verified",
      delta: 25,
    });
  }
  if (snap.phoneVerified) {
    score += 25;
    contributors.push({
      code: "phone_verified",
      label: "Phone verified",
      delta: 25,
    });
  }
  if (snap.governmentIdVerified) {
    score += 30;
    contributors.push({
      code: "government_id",
      label: "Government ID verified",
      delta: 30,
    });
  }
  if (snap.organizationVerified) {
    score += 10;
    contributors.push({
      code: "org_verified",
      label: "Organization verified",
      delta: 10,
    });
  }
  if (snap.addressVerified) {
    score += 10;
    contributors.push({
      code: "address_verified",
      label: "Address verified",
      delta: 10,
    });
  }
  return {
    dimension: "identity",
    score: clamp(score),
    weight: TRUST_DIMENSION_WEIGHTS.identity,
    contributors,
  };
}

export function calculateReliabilityScore(
  snap: TrustSignalSnapshot,
): TrustDimensionScore {
  const contributors: TrustDimensionScore["contributors"] = [];
  const completion = rate(
    snap.assignmentsCompleted,
    snap.assignmentsTotal,
    0.65,
  );
  const acceptance = rate(
    snap.assignmentsAccepted,
    Math.max(snap.assignmentsOffered, snap.assignmentsAccepted),
    0.7,
  );
  const deadline = clamp(snap.deadlineMetRate * 100, 0, 100) / 100;
  const attendance = clamp(snap.attendanceRate * 100, 0, 100) / 100;

  let responseFactor = 0.7;
  if (snap.avgResponseHours != null) {
    // Faster response → higher (under 2h ≈ 1.0, over 48h ≈ 0.3)
    responseFactor = clamp(100 - snap.avgResponseHours * 1.5, 30, 100) / 100;
  }

  const completionPts = completion * 35;
  const acceptancePts = acceptance * 15;
  const deadlinePts = deadline * 25;
  const attendancePts = attendance * 15;
  const responsePts = responseFactor * 10;

  contributors.push(
    {
      code: "completion_rate",
      label: `Completion rate ${Math.round(completion * 100)}%`,
      delta: Math.round(completionPts),
    },
    {
      code: "deadline_adherence",
      label: `Deadline adherence ${Math.round(deadline * 100)}%`,
      delta: Math.round(deadlinePts),
    },
    {
      code: "acceptance_rate",
      label: `Acceptance rate ${Math.round(acceptance * 100)}%`,
      delta: Math.round(acceptancePts),
    },
  );

  // Soft boost from recent positive assignment events
  const recentBoost = snap.weightedEvents
    .filter((e) => e.type === "assignment_completed")
    .reduce((s, e) => s + e.decayedWeight, 0);
  const boostPts = clamp(recentBoost * 0.15, 0, 8);

  return {
    dimension: "reliability",
    score: clamp(
      completionPts +
        acceptancePts +
        deadlinePts +
        attendancePts +
        responsePts +
        boostPts,
    ),
    weight: TRUST_DIMENSION_WEIGHTS.reliability,
    contributors,
  };
}

export function calculateQualityScore(
  snap: TrustSignalSnapshot,
): TrustDimensionScore {
  const contributors: TrustDimensionScore["contributors"] = [];
  const approval = rate(snap.reviewsApproved, snap.reviewsDecided, 0.7);
  const revisionRate = rate(
    snap.revisionRequestCount,
    Math.max(snap.reviewsDecided, 1),
    0.2,
  );
  const revisionFactor = 1 - Math.min(1, revisionRate);
  const confidence =
    snap.avgReviewConfidence != null
      ? clamp(snap.avgReviewConfidence * 100, 0, 100) / 100
      : 0.7;
  const feedbackPts = Math.min(10, snap.positiveFeedbackCount * 2);

  const approvalPts = approval * 50;
  const revisionPts = revisionFactor * 25;
  const confidencePts = confidence * 15;

  contributors.push(
    {
      code: "approval_rate",
      label: `Approval rate ${Math.round(approval * 100)}%`,
      delta: Math.round(approvalPts),
    },
    {
      code: "revision_frequency",
      label: `Low revision frequency (${Math.round(revisionRate * 100)}%)`,
      delta: Math.round(revisionPts),
    },
  );

  const approvedBoost = snap.weightedEvents
    .filter((e) => e.type === "submission_approved")
    .reduce((s, e) => s + e.decayedWeight, 0);
  const rejectedPenalty = snap.weightedEvents
    .filter(
      (e) =>
        e.type === "submission_rejected" ||
        e.type === "submission_revision_requested",
    )
    .reduce((s, e) => s + Math.abs(e.decayedWeight), 0);

  return {
    dimension: "quality",
    score: clamp(
      approvalPts +
        revisionPts +
        confidencePts +
        feedbackPts +
        clamp(approvedBoost * 0.2, 0, 10) -
        clamp(rejectedPenalty * 0.25, 0, 15),
    ),
    weight: TRUST_DIMENSION_WEIGHTS.quality,
    contributors,
  };
}

export function calculateBehaviorScore(
  snap: TrustSignalSnapshot,
): TrustDimensionScore {
  const contributors: TrustDimensionScore["contributors"] = [];
  let score = 100;
  const fraudPenalty = Math.min(60, snap.fraudConfirmedCount * 40);
  const violationPenalty = Math.min(30, snap.policyViolationCount * 15);
  const suspensionPenalty = Math.min(40, snap.suspensionCount * 30);
  const warningPenalty = Math.min(20, snap.warningCount * 5);
  const appealBoost = Math.min(15, snap.appealUpheldCount * 5);
  const appealDeniedPenalty = Math.min(10, snap.appealDeniedCount * 3);

  score -= fraudPenalty;
  score -= violationPenalty;
  score -= suspensionPenalty;
  score -= warningPenalty;
  score -= appealDeniedPenalty;
  score += appealBoost;

  if (fraudPenalty === 0) {
    contributors.push({
      code: "no_fraud",
      label: "No fraud incidents",
      delta: 0,
    });
  } else {
    contributors.push({
      code: "fraud_confirmed",
      label: `Fraud confirmed ×${snap.fraudConfirmedCount}`,
      delta: -fraudPenalty,
    });
  }
  if (suspensionPenalty > 0) {
    contributors.push({
      code: "suspensions",
      label: `Suspensions ×${snap.suspensionCount}`,
      delta: -suspensionPenalty,
    });
  }
  if (appealBoost > 0) {
    contributors.push({
      code: "appeals_upheld",
      label: `Appeals upheld ×${snap.appealUpheldCount}`,
      delta: appealBoost,
    });
  }

  return {
    dimension: "behavior",
    score: clamp(score),
    weight: TRUST_DIMENSION_WEIGHTS.behavior,
    contributors,
  };
}

export function calculateExperienceScore(
  snap: TrustSignalSnapshot,
): TrustDimensionScore {
  const contributors: TrustDimensionScore["contributors"] = [];
  // Log-ish curve for completed volume
  const volumePts = clamp(
    Math.log10(Math.max(1, snap.assignmentsCompleted + 1)) * 35,
    0,
    40,
  );
  const campaignPts = clamp(snap.distinctCampaigns * 6, 0, 25);
  const orgPts = clamp(snap.distinctOrganizations * 8, 0, 20);
  const tenurePts = clamp(snap.accountAgeDays / 10, 0, 15);

  contributors.push(
    {
      code: "assignments_completed",
      label: `${snap.assignmentsCompleted} assignments completed`,
      delta: Math.round(volumePts),
    },
    {
      code: "campaign_diversity",
      label: `${snap.distinctCampaigns} campaigns`,
      delta: Math.round(campaignPts),
    },
    {
      code: "tenure",
      label: `${snap.accountAgeDays} days on platform`,
      delta: Math.round(tenurePts),
    },
  );

  return {
    dimension: "experience",
    score: clamp(volumePts + campaignPts + orgPts + tenurePts),
    weight: TRUST_DIMENSION_WEIGHTS.experience,
    contributors,
  };
}

export function calculateReputationScore(
  snap: TrustSignalSnapshot,
): TrustDimensionScore {
  const contributors: TrustDimensionScore["contributors"] = [];
  let score = 45;
  const endorsePts = Math.min(35, snap.organizationEndorsements * 12);
  const recPts = Math.min(20, snap.verifiedRecommendations * 10);
  score += endorsePts + recPts;

  const endorseEvents = snap.weightedEvents
    .filter((e) => e.type === "organization_endorsement")
    .reduce((s, e) => s + e.decayedWeight, 0);
  score += clamp(endorseEvents * 0.3, 0, 10);

  if (endorsePts > 0) {
    contributors.push({
      code: "org_endorsements",
      label: `${snap.organizationEndorsements} organization endorsement(s)`,
      delta: endorsePts,
    });
  } else {
    contributors.push({
      code: "reputation_base",
      label: "Building reputation",
      delta: 45,
    });
  }

  return {
    dimension: "reputation",
    score: clamp(score),
    weight: TRUST_DIMENSION_WEIGHTS.reputation,
    contributors,
  };
}

export function calculateAllDimensions(
  snap: TrustSignalSnapshot,
): TrustDimensionScore[] {
  return [
    calculateIdentityScore(snap),
    calculateReliabilityScore(snap),
    calculateQualityScore(snap),
    calculateBehaviorScore(snap),
    calculateExperienceScore(snap),
    calculateReputationScore(snap),
  ];
}

export function calculateOverallScore(
  dimensions: TrustDimensionScore[],
): number {
  let sum = 0;
  for (const d of dimensions) {
    sum += d.score * d.weight;
  }
  return clamp(sum);
}

export function calculateTrustScores(snap: TrustSignalSnapshot): {
  overallScore: number;
  dimensions: Record<TrustDimension, number>;
  dimensionDetails: TrustDimensionScore[];
} {
  const dimensionDetails = calculateAllDimensions(snap);
  const dimensions = {
    identity: 0,
    reliability: 0,
    quality: 0,
    behavior: 0,
    experience: 0,
    reputation: 0,
  } satisfies Record<TrustDimension, number>;
  for (const d of dimensionDetails) {
    dimensions[d.dimension] = d.score;
  }
  return {
    overallScore: calculateOverallScore(dimensionDetails),
    dimensions,
    dimensionDetails,
  };
}
