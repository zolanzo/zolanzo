/**
 * ExplanationBuilder — human-readable recommendation reasons.
 */

import type {
  MatchRecommendationLabel,
  MatchReasonDetail,
  WorkerMatchRecommendation,
  WorkerMatchSignals,
  WorkerScoreBreakdown,
} from "@/lib/ai/ranking/match-types";

export function labelForScore(score: number): MatchRecommendationLabel {
  if (score >= 85) return "highly_recommended";
  if (score >= 70) return "recommended";
  if (score >= 50) return "consider";
  return "low_fit";
}

export function recommendationLabelText(
  label: MatchRecommendationLabel,
): string {
  switch (label) {
    case "highly_recommended":
      return "Highly Recommended";
    case "recommended":
      return "Recommended";
    case "consider":
      return "Consider";
    case "low_fit":
      return "Low Fit";
  }
}

/**
 * Convert score contributions into sorted, readable reasons.
 * Negative deltas become warnings-friendly phrasing.
 */
export function buildExplanation(params: {
  worker: WorkerMatchSignals;
  breakdown: WorkerScoreBreakdown;
  matchScore: number;
  ruleScore: number;
  aiConfidence: number | null;
  confidence: number;
  explainabilityEnabled: boolean;
}): WorkerMatchRecommendation {
  const sorted = [...params.breakdown.contributions]
    .filter((c) => c.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const reasonDetails: MatchReasonDetail[] = params.explainabilityEnabled
    ? sorted.slice(0, 8).map((c) => ({
        code: c.code,
        label: c.label,
        delta: c.delta,
      }))
    : [];

  const reasons = params.explainabilityEnabled
    ? reasonDetails.map((r) => {
        const sign = r.delta >= 0 ? "+" : "";
        return `${sign}${Math.round(r.delta)} ${r.label}`;
      })
    : [`Score ${params.matchScore}`];

  if (params.aiConfidence != null && params.explainabilityEnabled) {
    reasons.push(
      `AI confidence ${(params.aiConfidence * 100).toFixed(0)}%`,
    );
  }

  const label = labelForScore(params.matchScore);
  reasons.push(`Recommendation: ${recommendationLabelText(label)}`);

  return {
    workerId: params.worker.workerId,
    workerPublicId: params.worker.workerPublicId,
    displayName: params.worker.displayName,
    matchScore: params.matchScore,
    ruleScore: params.ruleScore,
    aiConfidence: params.aiConfidence,
    confidence: params.confidence,
    reasons,
    reasonDetails,
    warnings: [...params.breakdown.warnings],
    label,
  };
}
