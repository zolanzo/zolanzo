/**
 * AI confidence augment — optional. Never replaces rule score entirely.
 *
 * Final = ruleScore when AI disabled / fallback
 * Final = ruleScore + (aiConfidence - 0.5) * 10 when AI enabled
 *   e.g. rule 87 + confidence 0.94 → ~91
 */

import { shouldAugmentWithAiConfidence } from "@/lib/ai/ranking/match-config";
import type {
  WorkerMatchSignals,
  WorkerScoreBreakdown,
} from "@/lib/ai/ranking/match-types";

/**
 * Deterministic confidence from signal quality (no LLM required).
 * Used as primary AI confidence and as fallback when LLM fails.
 */
export function estimateAiConfidence(params: {
  worker: WorkerMatchSignals;
  breakdown: WorkerScoreBreakdown;
}): number {
  let completeness = 0;
  let checks = 0;

  const mark = (ok: boolean) => {
    checks += 1;
    if (ok) completeness += 1;
  };

  mark(params.worker.trustScore > 0);
  mark(params.worker.completedTasks > 0);
  mark(params.worker.approvalRate > 0);
  mark(Boolean(params.worker.countryCode));
  mark(params.worker.skills.length > 0 || params.worker.languages.length > 0);
  mark(params.worker.emailVerified || params.worker.phoneVerified);
  mark(params.breakdown.warnings.length <= 1);

  const base = checks > 0 ? completeness / checks : 0.5;
  const positive = params.breakdown.contributions.filter((c) => c.delta > 0)
    .length;
  const consistency = Math.min(1, positive / 6);
  return Math.max(0.35, Math.min(0.99, 0.55 * base + 0.45 * consistency));
}

export function combineRuleAndAiScore(params: {
  ruleScore: number;
  aiConfidence: number | null;
  aiEnabled: boolean;
}): { matchScore: number; fallbackUsed: boolean; aiAugmented: boolean } {
  if (!params.aiEnabled || params.aiConfidence == null) {
    return {
      matchScore: params.ruleScore,
      fallbackUsed: false,
      aiAugmented: false,
    };
  }

  const boost = (params.aiConfidence - 0.5) * 10;
  const matchScore = Math.max(
    0,
    Math.min(100, Math.round(params.ruleScore + boost)),
  );

  return {
    matchScore,
    fallbackUsed: false,
    aiAugmented: true,
  };
}

export function resolveAiConfidenceForWorker(params: {
  worker: WorkerMatchSignals;
  breakdown: WorkerScoreBreakdown;
  /** Force off in tests */
  forceDisabled?: boolean;
}): {
  aiConfidence: number | null;
  aiEnabled: boolean;
} {
  const aiEnabled =
    !params.forceDisabled && shouldAugmentWithAiConfidence();
  if (!aiEnabled) {
    return { aiConfidence: null, aiEnabled: false };
  }
  return {
    aiConfidence: estimateAiConfidence(params),
    aiEnabled: true,
  };
}
