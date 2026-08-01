/**
 * Production RankingEngine — scores eligible workers; never assigns.
 */

import { generateCandidates } from "@/lib/ai/ranking/candidate-generator";
import { filterEligibleWorkers } from "@/lib/ai/ranking/eligibility-filter";
import { buildWorkerScore } from "@/lib/ai/ranking/score-builder";
import { buildExplanation } from "@/lib/ai/ranking/explanation-builder";
import {
  applyFairnessAdjustments,
  resolveFairnessPolicy,
} from "@/lib/ai/ranking/fairness";
import {
  combineRuleAndAiScore,
  resolveAiConfidenceForWorker,
} from "@/lib/ai/ranking/ai-confidence";
import {
  isMatchEngineEnabled,
  isMatchExplainabilityEnabled,
  isMatchFairnessEnabled,
  MATCH_ENGINE_MODEL_VERSION,
} from "@/lib/ai/ranking/match-config";
import { recordRankingTelemetry } from "@/lib/ai/ranking/ranking-telemetry";
import type {
  FairnessPolicy,
  MatchCampaignContext,
  WorkerMatchRecommendation,
  WorkerMatchSignals,
} from "@/lib/ai/ranking/match-types";
import type {
  RankingEngine,
  WorkerRankingInput,
  WorkerRankingResult,
} from "@/lib/ai/types";

export type RankWorkersDetailedInput = {
  campaign: MatchCampaignContext;
  pool: WorkerMatchSignals[];
  candidateWorkerIds?: string[];
  topN?: number;
  fairness?: Partial<FairnessPolicy> | null;
  /** Skip AI confidence (tests / explicit rule-only) */
  forceRuleOnly?: boolean;
  knowledgeSnapshot?: Record<string, unknown>;
};

export type RankWorkersDetailedResult = WorkerRankingResult & {
  recommendations: WorkerMatchRecommendation[];
  candidateCount: number;
  eligibleCount: number;
  rejectedCount: number;
  ineligibleCount: number;
  fairnessApplied: boolean;
  aiAugmented: boolean;
  fallbackUsed: boolean;
  latencyMs: number;
};

export async function rankWorkersDetailed(
  input: RankWorkersDetailedInput,
): Promise<RankWorkersDetailedResult> {
  const started = Date.now();

  if (!isMatchEngineEnabled()) {
    const latencyMs = Date.now() - started;
    recordRankingTelemetry({
      success: false,
      latencyMs,
      fallbackUsed: true,
    });
    return {
      rankings: [],
      recommendations: [],
      modelVersion: MATCH_ENGINE_MODEL_VERSION,
      advisoryOnly: true,
      candidateCount: 0,
      eligibleCount: 0,
      rejectedCount: 0,
      ineligibleCount: 0,
      fairnessApplied: false,
      aiAugmented: false,
      fallbackUsed: true,
      latencyMs,
    };
  }

  try {
    const generated = generateCandidates({
      campaign: input.campaign,
      pool: input.pool,
      candidateWorkerIds: input.candidateWorkerIds,
    });

    const filtered = filterEligibleWorkers({
      campaign: input.campaign,
      candidates: generated.candidates,
    });

    const explainability = isMatchExplainabilityEnabled();
    const fairnessEnabled = isMatchFairnessEnabled();
    const fairnessPolicy = resolveFairnessPolicy(input.fairness);

    let anyAi = false;
    let anyFallback = false;

    const prelim = filtered.eligible.map((worker) => {
      const breakdown = buildWorkerScore({
        worker,
        campaign: input.campaign,
      });
      const { aiConfidence, aiEnabled } = resolveAiConfidenceForWorker({
        worker,
        breakdown,
        forceDisabled: input.forceRuleOnly,
      });
      const combined = combineRuleAndAiScore({
        ruleScore: breakdown.ruleScore,
        aiConfidence,
        aiEnabled,
      });
      if (combined.aiAugmented) anyAi = true;
      if (combined.fallbackUsed) anyFallback = true;

      const recommendation = buildExplanation({
        worker,
        breakdown,
        matchScore: combined.matchScore,
        ruleScore: breakdown.ruleScore,
        aiConfidence,
        confidence: aiConfidence ?? Math.min(0.95, breakdown.ruleScore / 100),
        explainabilityEnabled: explainability,
      });

      return { worker, recommendation };
    });

    const fair = applyFairnessAdjustments({
      ranked: prelim.sort(
        (a, b) => b.recommendation.matchScore - a.recommendation.matchScore,
      ),
      policy: fairnessPolicy,
      enabled: fairnessEnabled,
    });

    const topN = input.topN ?? 10;
    const top = fair.slice(0, topN);
    const recommendations = top.map((t) => t.recommendation);
    const latencyMs = Date.now() - started;
    const avg =
      recommendations.length > 0
        ? recommendations.reduce((s, r) => s + r.matchScore, 0) /
          recommendations.length
        : 0;

    recordRankingTelemetry({
      success: true,
      latencyMs,
      averageScore: avg,
      scoredWorkers: recommendations.length,
      fallbackUsed: anyFallback,
      aiAugmented: anyAi,
    });

    return {
      rankings: recommendations.map((r) => ({
        workerId: r.workerId,
        matchScore: r.matchScore,
        reasons: r.reasons,
        confidence: r.confidence,
        warnings: r.warnings,
        aiConfidence: r.aiConfidence,
        ruleScore: r.ruleScore,
        label: r.label,
      })),
      recommendations,
      modelVersion: MATCH_ENGINE_MODEL_VERSION,
      advisoryOnly: true,
      candidateCount: generated.candidates.length,
      eligibleCount: filtered.eligible.length,
      rejectedCount: generated.rejected.length,
      ineligibleCount: filtered.ineligible.length,
      fairnessApplied: fairnessEnabled,
      aiAugmented: anyAi,
      fallbackUsed: anyFallback,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - started;
    recordRankingTelemetry({
      success: false,
      latencyMs,
      fallbackUsed: true,
    });
    throw error;
  }
}

/**
 * Adapter satisfying RankingEngine port (4.1A interface).
 */
export const rankingEngine: RankingEngine = {
  async rankWorkers(input: WorkerRankingInput): Promise<WorkerRankingResult> {
    const campaign = (input.knowledgeSnapshot.campaign ??
      input.knowledgeSnapshot) as MatchCampaignContext | undefined;

    if (!campaign || typeof campaign !== "object" || !("campaignId" in campaign)) {
      // Minimal campaign shell when only ids provided
      const shell: MatchCampaignContext = {
        campaignId: input.campaignId,
        publicId: input.campaignId,
        organizationId: input.organizationId,
        name: "Campaign",
        category: "general",
        status: "active",
        countryScope: [],
        languageScope: [],
        deviceScope: [],
        requiredSkills: [],
        rewardPerUnitMinor: 0,
        budgetMinor: 0,
        currency: "NGN",
        targetQuantity: 1,
        constraints: [],
      };
      const pool = (input.knowledgeSnapshot.workers as WorkerMatchSignals[]) ?? [];
      const detailed = await rankWorkersDetailed({
        campaign: shell,
        pool,
        candidateWorkerIds: input.candidateWorkerIds,
        topN: 10,
      });
      return {
        rankings: detailed.rankings,
        modelVersion: detailed.modelVersion,
        advisoryOnly: true,
      };
    }

    const pool =
      (input.knowledgeSnapshot.workers as WorkerMatchSignals[] | undefined) ??
      [];
    const detailed = await rankWorkersDetailed({
      campaign: {
        ...campaign,
        campaignId: campaign.campaignId ?? input.campaignId,
        organizationId: campaign.organizationId ?? input.organizationId,
      },
      pool,
      candidateWorkerIds: input.candidateWorkerIds,
      topN: 10,
    });

    return {
      rankings: detailed.rankings,
      modelVersion: detailed.modelVersion,
      advisoryOnly: true,
    };
  },
};

/** @deprecated Use rankingEngine — kept for import compatibility */
export const rankingEngineStub = rankingEngine;
