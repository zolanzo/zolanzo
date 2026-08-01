/**
 * ScoreBuilder — multi-signal rule score (0–100). No AI.
 */

import type {
  MatchCampaignContext,
  ScoreContribution,
  WorkerMatchSignals,
  WorkerScoreBreakdown,
} from "@/lib/ai/ranking/match-types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Build an additive rule score from objective signals.
 * Weights are intentional and documented for explainability.
 */
export function buildWorkerScore(params: {
  worker: WorkerMatchSignals;
  campaign: MatchCampaignContext;
}): WorkerScoreBreakdown {
  const { worker, campaign } = params;
  const contributions: ScoreContribution[] = [];
  const warnings: string[] = [];

  // Trust (max ~18)
  const trustPts = clamp((worker.trustScore / 100) * 18, 0, 18);
  contributions.push({
    code: "trust",
    label: trustPts >= 14 ? "Strong trust profile" : "Trust score",
    delta: round1(trustPts),
    signal: worker.trustScore,
  });
  if (worker.identityVerified) {
    contributions.push({
      code: "identity_verified",
      label: "Identity verified",
      delta: 4,
      signal: true,
    });
  }
  if (!worker.emailVerified && !worker.phoneVerified) {
    warnings.push("Contact channels not verified");
  }

  // Performance — completion (max ~16)
  const completionPts = clamp(worker.completionRate * 16, 0, 16);
  contributions.push({
    code: "completion_rate",
    label:
      worker.completionRate >= 0.85
        ? "Excellent completion history"
        : "Completion rate",
    delta: round1(completionPts),
    signal: worker.completionRate,
  });

  // Approval (max ~16)
  const approvalPts = clamp(worker.approvalRate * 16, 0, 16);
  contributions.push({
    code: "approval_rate",
    label:
      worker.approvalRate >= 0.9
        ? "High approval rate"
        : "Approval rate",
    delta: round1(approvalPts),
    signal: worker.approvalRate,
  });

  // Experience (max ~12)
  const experienceBase = clamp(Math.log10(worker.completedTasks + 1) * 6, 0, 8);
  const similarPts = clamp(worker.similarCampaignCompletions * 2, 0, 4);
  contributions.push({
    code: "experience",
    label:
      worker.similarCampaignCompletions > 0
        ? "Similar campaign experience"
        : "Campaign experience",
    delta: round1(experienceBase + similarPts),
    signal: worker.completedTasks,
  });

  // Availability / workload (max ~10, can go negative via warnings)
  let availabilityPts = clamp(worker.capacityRemaining * 2.5, 0, 10);
  if (worker.activeAssignments > 0) {
    const penalty = Math.min(8, worker.activeAssignments * 4);
    availabilityPts = clamp(availabilityPts - penalty, -8, 10);
    warnings.push(
      worker.activeAssignments === 1
        ? "Currently handling another task"
        : `Currently handling ${worker.activeAssignments} tasks`,
    );
  }
  contributions.push({
    code: "availability",
    label:
      worker.activeAssignments > 0
        ? "Current workload"
        : "Available capacity",
    delta: round1(availabilityPts),
    signal: worker.activeAssignments,
  });

  // Geography (max ~10)
  let geoPts = 0;
  if (
    worker.countryCode &&
    campaign.countryScope.includes(worker.countryCode)
  ) {
    geoPts = 10 - worker.distanceScore * 4;
    contributions.push({
      code: "geography",
      label: worker.distanceScore <= 0.25 ? "Nearby" : "In campaign region",
      delta: round1(clamp(geoPts, 0, 10)),
      signal: worker.countryCode,
    });
  } else if (campaign.countryScope.length === 0) {
    contributions.push({
      code: "geography",
      label: "No geographic restriction",
      delta: 5,
      signal: worker.countryCode,
    });
  } else {
    contributions.push({
      code: "geography",
      label: "Outside preferred region",
      delta: 0,
      signal: worker.countryCode,
    });
    warnings.push("Outside preferred campaign geography");
  }

  // Organization history (max ~8)
  if (worker.organizationHistoryCount > 0) {
    const orgPts = clamp(4 + Math.min(4, worker.organizationHistoryCount), 0, 8);
    contributions.push({
      code: "organization_history",
      label: "Trusted by this organization",
      delta: round1(orgPts),
      signal: worker.organizationHistoryCount,
    });
  } else {
    contributions.push({
      code: "organization_history",
      label: "No prior work with this organization",
      delta: 0,
      signal: 0,
    });
  }

  // Communication / response (max ~5)
  contributions.push({
    code: "response_speed",
    label: "Response speed",
    delta: round1(clamp((worker.responseSpeedScore / 100) * 5, 0, 5)),
    signal: worker.responseSpeedScore,
  });

  // Cost efficiency (max ~5) — prefer workers when reward fits budget headroom
  const budgetHeadroom =
    campaign.budgetMinor > 0
      ? 1 -
        Math.min(
          1,
          (worker.expectedPayoutMinor * campaign.targetQuantity) /
            Math.max(1, campaign.budgetMinor),
        )
      : 0.5;
  contributions.push({
    code: "cost",
    label: "Cost efficiency",
    delta: round1(clamp(budgetHeadroom * 5, 0, 5)),
    signal: worker.expectedPayoutMinor,
  });

  // Skills soft match bonus
  if (campaign.requiredSkills.length > 0) {
    const hits = campaign.requiredSkills.filter((s) =>
      worker.skills.includes(s),
    ).length;
    if (hits > 0) {
      contributions.push({
        code: "skills",
        label: "Matching skills",
        delta: clamp(hits * 2, 0, 6),
        signal: hits,
      });
    } else if (worker.skills.length === 0) {
      warnings.push("Skills profile incomplete");
    }
  }

  const ruleScore = clamp(
    Math.round(contributions.reduce((sum, c) => sum + c.delta, 0)),
  );

  return {
    workerId: worker.workerId,
    ruleScore,
    contributions,
    warnings,
  };
}
