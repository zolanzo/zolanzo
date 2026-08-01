/**
 * RankingEngine — Phase 4.1B AI Match Engine.
 */

export type {
  RankingEngine,
  WorkerRankingInput,
  WorkerRankingResult,
  WorkerRankingEntry,
} from "@/lib/ai/types";

export type {
  MatchCampaignContext,
  WorkerMatchSignals,
  WorkerMatchRecommendation,
  FairnessPolicy,
  MatchReasonDetail,
} from "@/lib/ai/ranking/match-types";

export { DEFAULT_FAIRNESS_POLICY } from "@/lib/ai/ranking/match-types";
export { generateCandidates } from "@/lib/ai/ranking/candidate-generator";
export { filterEligibleWorkers } from "@/lib/ai/ranking/eligibility-filter";
export { buildWorkerScore } from "@/lib/ai/ranking/score-builder";
export {
  buildExplanation,
  labelForScore,
  recommendationLabelText,
} from "@/lib/ai/ranking/explanation-builder";
export {
  applyFairnessAdjustments,
  resolveFairnessPolicy,
} from "@/lib/ai/ranking/fairness";
export {
  estimateAiConfidence,
  combineRuleAndAiScore,
} from "@/lib/ai/ranking/ai-confidence";
export {
  rankingEngine,
  rankingEngineStub,
  rankWorkersDetailed,
} from "@/lib/ai/ranking/ranking-engine";
export {
  getRankingTelemetrySnapshot,
  resetRankingTelemetryForTests,
  recordRankingTelemetry,
} from "@/lib/ai/ranking/ranking-telemetry";
export {
  isMatchEngineEnabled,
  isMatchExplainabilityEnabled,
  isMatchFairnessEnabled,
  shouldAugmentWithAiConfidence,
  MATCH_ENGINE_MODEL_VERSION,
} from "@/lib/ai/ranking/match-config";
