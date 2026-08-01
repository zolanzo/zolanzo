/**
 * TrustExplanationBuilder — human-readable reasons and warnings.
 */

import { isTrustExplainabilityEnabled } from "@/lib/trust/config";
import type {
  TrustDimensionScore,
  TrustTrend,
} from "@/lib/trust/types";
import { TRUST_SCORE_BANDS } from "@/constants/trust";

export function bandForScore(score: number): string {
  for (const band of TRUST_SCORE_BANDS) {
    if (score >= band.min && score <= band.max) return band.label;
  }
  return "Unknown";
}

export function buildTrustExplanation(params: {
  overallScore: number;
  dimensionDetails: TrustDimensionScore[];
  trend: TrustTrend;
  explainability?: boolean;
}): { reasons: string[]; warnings: string[] } {
  const explain = params.explainability ?? isTrustExplainabilityEnabled();
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!explain) {
    return {
      reasons: [`Overall trust ${params.overallScore} (${bandForScore(params.overallScore)})`],
      warnings: [],
    };
  }

  reasons.push(
    `Overall trust ${params.overallScore} — ${bandForScore(params.overallScore)}`,
  );

  const sortedDims = [...params.dimensionDetails].sort(
    (a, b) => b.score - a.score,
  );
  for (const dim of sortedDims.slice(0, 3)) {
    const top = [...dim.contributors].sort(
      (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
    )[0];
    if (top && top.delta !== 0) {
      reasons.push(top.label);
    } else if (dim.score >= 90) {
      reasons.push(`Strong ${dim.dimension} (${dim.score})`);
    }
  }

  // Highlight verification / clean behavior
  const identity = params.dimensionDetails.find((d) => d.dimension === "identity");
  const behavior = params.dimensionDetails.find((d) => d.dimension === "behavior");
  if (identity && identity.score >= 50) {
    const verified = identity.contributors.filter((c) => c.delta > 0);
    if (verified.length) {
      reasons.push(verified.map((v) => v.label).join(" · "));
    }
  }
  if (behavior && behavior.score >= 95) {
    reasons.push("No fraud incidents");
  }

  if (params.trend === "improving") {
    reasons.push("Recent increase in trust signals");
  } else if (params.trend === "declining") {
    warnings.push("Recent decline in trust signals");
  }

  if (identity && identity.score < 40) {
    warnings.push("Complete identity verification to improve trust");
  }
  if (behavior && behavior.score < 70) {
    warnings.push("Behavior score is below healthy range");
  }
  if (params.overallScore < 40) {
    warnings.push("Low trust may limit high-value work eligibility");
  }

  // Dedupe while preserving order
  const uniq = (items: string[]) => [...new Set(items)];
  return { reasons: uniq(reasons).slice(0, 8), warnings: uniq(warnings).slice(0, 5) };
}
