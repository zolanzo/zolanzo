/**
 * TrustTrendAnalyzer — improving / stable / declining from history.
 */

import { isTrustTrendsEnabled } from "@/lib/trust/config";
import type { TrustTrend } from "@/lib/trust/types";

export function analyzeTrustTrend(params: {
  currentOverall: number;
  previousOverall: number | null;
  /** Recent decayed positive event mass */
  recentPositiveWeight?: number;
  /** Recent decayed negative event mass */
  recentNegativeWeight?: number;
  enabled?: boolean;
}): { trend: TrustTrend; trendDelta: number } {
  if (!(params.enabled ?? isTrustTrendsEnabled())) {
    return { trend: "unknown", trendDelta: 0 };
  }

  const prev = params.previousOverall;
  if (prev == null) {
    // Bootstrap from recent events if available
    const pos = params.recentPositiveWeight ?? 0;
    const neg = params.recentNegativeWeight ?? 0;
    if (pos - neg > 5) return { trend: "improving", trendDelta: pos - neg };
    if (neg - pos > 5) return { trend: "declining", trendDelta: pos - neg };
    return { trend: "stable", trendDelta: 0 };
  }

  const delta = Math.round((params.currentOverall - prev) * 10) / 10;
  if (delta >= 2) return { trend: "improving", trendDelta: delta };
  if (delta <= -2) return { trend: "declining", trendDelta: delta };
  return { trend: "stable", trendDelta: delta };
}
