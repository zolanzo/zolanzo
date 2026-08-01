/**
 * Fairness policies — tunable balancing, not hard-coded winner-take-all.
 */

import {
  DEFAULT_FAIRNESS_POLICY,
  type FairnessPolicy,
  type WorkerMatchRecommendation,
  type WorkerMatchSignals,
} from "@/lib/ai/ranking/match-types";

export function resolveFairnessPolicy(
  override?: Partial<FairnessPolicy> | null,
): FairnessPolicy {
  return { ...DEFAULT_FAIRNESS_POLICY, ...override };
}

/**
 * Adjust scores for diversity, new workers, org preference, rotation, region.
 * Returns new matchScore values (ruleScore unchanged).
 */
export function applyFairnessAdjustments(params: {
  ranked: Array<{
    worker: WorkerMatchSignals;
    recommendation: WorkerMatchRecommendation;
  }>;
  policy: FairnessPolicy;
  enabled: boolean;
}): Array<{
  worker: WorkerMatchSignals;
  recommendation: WorkerMatchRecommendation;
}> {
  if (!params.enabled || params.ranked.length === 0) {
    return params.ranked;
  }

  const { policy } = params;
  const regionCounts = new Map<string, number>();

  const adjusted = params.ranked.map(({ worker, recommendation }, index) => {
    let score = recommendation.matchScore;
    const extraReasons: string[] = [];
    const warnings = [...recommendation.warnings];

    // New worker boost
    if (worker.completedTasks < 3) {
      score += policy.newWorkerBoost;
      extraReasons.push(`+${policy.newWorkerBoost} New worker boost`);
    }

    // Organization preference
    if (worker.organizationHistoryCount > 0) {
      const boost = Math.min(
        policy.organizationPreferenceBoost,
        4 + worker.organizationHistoryCount * 2,
      );
      score += boost;
      // Already explained via org history contribution — skip duplicate unless boost large
      if (boost >= 8) {
        extraReasons.push(`+${boost} Organization preference`);
      }
    }

    // Opportunity rotation — dampen workers with high active load / many completions
    if (policy.opportunityRotation) {
      if (worker.activeAssignments > 1) {
        const penalty =
          (worker.activeAssignments - 1) * policy.workloadPenaltyPerActive;
        score -= penalty;
        warnings.push("Opportunity rotation: high current workload");
      }
      // Mild dampening for very experienced to open slots
      if (worker.completedTasks > 50) {
        score -= Math.min(6, Math.floor(worker.completedTasks / 25));
      }
    }

    // Diversity factor — slightly compress top ranks
    if (policy.diversityFactor > 0 && index < 3) {
      const dampen = policy.diversityFactor * (3 - index) * 2;
      score -= dampen;
    }

    // Regional balance — soft penalty when region already over-represented in top set
    if (policy.regionalBalance) {
      const region = worker.region ?? worker.countryCode ?? "unknown";
      const count = regionCounts.get(region) ?? 0;
      if (count >= 2) {
        score -= 3 * (count - 1);
        warnings.push("Regional balance adjustment applied");
      }
      regionCounts.set(region, count + 1);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      worker,
      recommendation: {
        ...recommendation,
        matchScore: score,
        reasons: [...recommendation.reasons.filter((r) => !r.startsWith("Recommendation:")), ...extraReasons, recommendation.reasons.find((r) => r.startsWith("Recommendation:")) ?? ""].filter(Boolean),
        warnings,
      },
    };
  });

  // Re-sort after fairness
  adjusted.sort(
    (a, b) => b.recommendation.matchScore - a.recommendation.matchScore,
  );

  // Refresh labels after score changes
  return adjusted.map(({ worker, recommendation }) => {
    const label =
      recommendation.matchScore >= 85
        ? "highly_recommended"
        : recommendation.matchScore >= 70
          ? "recommended"
          : recommendation.matchScore >= 50
            ? "consider"
            : "low_fit";
    const labelText =
      label === "highly_recommended"
        ? "Highly Recommended"
        : label === "recommended"
          ? "Recommended"
          : label === "consider"
            ? "Consider"
            : "Low Fit";
    const withoutOldLabel = recommendation.reasons.filter(
      (r) => !r.startsWith("Recommendation:"),
    );
    return {
      worker,
      recommendation: {
        ...recommendation,
        label,
        reasons: [...withoutOldLabel, `Recommendation: ${labelText}`],
      },
    };
  });
}
