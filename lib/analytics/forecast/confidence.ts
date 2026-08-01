/**
 * Confidence helpers — explainable 0–100 scores.
 */

import type { ForecastRiskLevel } from "@/lib/analytics/forecast/types";

export function clampConfidence(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Sample-size based base confidence. */
export function confidenceFromSampleSize(sampleSize: number): number {
  if (sampleSize <= 0) return 15;
  if (sampleSize < 5) return 35;
  if (sampleSize < 20) return 55;
  if (sampleSize < 50) return 70;
  if (sampleSize < 200) return 82;
  return 90;
}

export function confidenceBand(
  confidence: number,
): "low" | "medium" | "high" {
  if (confidence < 45) return "low";
  if (confidence < 70) return "medium";
  return "high";
}

export function riskFromProbability(p: number): ForecastRiskLevel {
  if (!Number.isFinite(p)) return "unknown";
  if (p >= 0.75) return "critical";
  if (p >= 0.5) return "high";
  if (p >= 0.25) return "medium";
  return "low";
}

export function highestRisk(
  levels: ForecastRiskLevel[],
): ForecastRiskLevel {
  const order: ForecastRiskLevel[] = [
    "unknown",
    "low",
    "medium",
    "high",
    "critical",
  ];
  let best: ForecastRiskLevel = "unknown";
  for (const level of levels) {
    if (order.indexOf(level) > order.indexOf(best)) best = level;
  }
  return best;
}

/** Extrapolate days remaining given remaining units and daily rate. */
export function etaDaysRemaining(
  remaining: number,
  dailyRate: number,
): number | null {
  if (remaining <= 0) return 0;
  if (dailyRate <= 0) return null;
  return Math.ceil(remaining / dailyRate);
}

export function addUtcDaysIso(from: Date, days: number): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
