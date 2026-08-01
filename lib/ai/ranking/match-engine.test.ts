/**
 * Phase 4.1B — AI Match Engine tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
  estimateAiConfidence,
} from "@/lib/ai/ranking/ai-confidence";
import { rankWorkersDetailed, rankingEngine } from "@/lib/ai/ranking/ranking-engine";
import {
  isMatchEngineEnabled,
  isMatchExplainabilityEnabled,
  isMatchFairnessEnabled,
} from "@/lib/ai/ranking/match-config";
import {
  getRankingTelemetrySnapshot,
  resetRankingTelemetryForTests,
} from "@/lib/ai/ranking/ranking-telemetry";
import type {
  MatchCampaignContext,
  WorkerMatchSignals,
} from "@/lib/ai/ranking/match-types";

const ORIGINAL_ENV = { ...process.env };

function campaign(overrides: Partial<MatchCampaignContext> = {}): MatchCampaignContext {
  return {
    campaignId: "cmp_1",
    publicId: "CMP-2026-000001",
    organizationId: "org_1",
    name: "Kano Field Agents",
    category: "field",
    status: "active",
    countryScope: ["NG"],
    languageScope: ["en"],
    deviceScope: [],
    requiredSkills: ["field_survey"],
    rewardPerUnitMinor: 12_000_00,
    budgetMinor: 2_800_000_00,
    currency: "NGN",
    targetQuantity: 250,
    constraints: [
      {
        id: "min_trust",
        kind: "worker",
        op: "min_trust_score",
        params: { min: 40 },
        enforcement: "hard",
      },
    ],
    ...overrides,
  };
}

function worker(
  id: string,
  overrides: Partial<WorkerMatchSignals> = {},
): WorkerMatchSignals {
  return {
    workerId: id,
    workerPublicId: `WRK-${id}`,
    displayName: `Worker ${id}`,
    countryCode: "NG",
    region: "NG-KN",
    languages: ["en"],
    skills: ["field_survey"],
    platforms: ["android"],
    organizationIds: ["org_1"],
    trustScore: 80,
    trustBadges: [],
    identityVerified: true,
    emailVerified: true,
    phoneVerified: true,
    completionRate: 0.92,
    approvalRate: 0.95,
    completedTasks: 40,
    similarCampaignCompletions: 5,
    activeAssignments: 0,
    capacityRemaining: 4,
    hoursSinceLastActivity: 2,
    responseSpeedScore: 85,
    organizationHistoryCount: 3,
    expectedPayoutMinor: 12_000_00,
    accountAgeDays: 200,
    distanceScore: 0.1,
    ...overrides,
  };
}

beforeEach(() => {
  resetRankingTelemetryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AI_MATCH_ENGINE;
  delete process.env.AI_EXPLAINABILITY;
  delete process.env.AI_FAIRNESS;
  delete process.env.AI_ENABLED;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults match engine / explainability / fairness on", () => {
    expect(isMatchEngineEnabled()).toBe(true);
    expect(isMatchExplainabilityEnabled()).toBe(true);
    expect(isMatchFairnessEnabled()).toBe(true);
  });

  it("respects AI_MATCH_ENGINE=0", () => {
    process.env.AI_MATCH_ENGINE = "0";
    expect(isMatchEngineEnabled()).toBe(false);
  });
});

describe("CandidateGenerator", () => {
  it("filters by country / language / skills", () => {
    const result = generateCandidates({
      campaign: campaign(),
      pool: [
        worker("a"),
        worker("b", { countryCode: "KE" }),
        worker("c", { languages: ["fr"] }),
        worker("d", { skills: ["other"], countryCode: "NG", languages: ["en"] }),
      ],
    });
    expect(result.candidates.map((c) => c.workerId)).toEqual(["a"]);
    expect(result.rejected.some((r) => r.reason === "country_scope")).toBe(true);
    expect(result.rejected.some((r) => r.reason === "language_scope")).toBe(true);
    expect(result.rejected.some((r) => r.reason === "required_skills")).toBe(true);
  });
});

describe("EligibilityFilter", () => {
  it("rejects low trust via hard constraint", () => {
    const filtered = filterEligibleWorkers({
      campaign: campaign(),
      candidates: [
        worker("ok"),
        worker("low", { trustScore: 10 }),
      ],
    });
    expect(filtered.eligible.map((w) => w.workerId)).toEqual(["ok"]);
    expect(filtered.ineligible[0]?.workerId).toBe("low");
  });
});

describe("ScoreBuilder + Explanation", () => {
  it("scores strong workers highly with explainable reasons", () => {
    const w = worker("star");
    const breakdown = buildWorkerScore({ worker: w, campaign: campaign() });
    expect(breakdown.ruleScore).toBeGreaterThanOrEqual(70);
    const explanation = buildExplanation({
      worker: w,
      breakdown,
      matchScore: breakdown.ruleScore,
      ruleScore: breakdown.ruleScore,
      aiConfidence: null,
      confidence: 0.9,
      explainabilityEnabled: true,
    });
    expect(explanation.reasons.some((r) => r.includes("+"))).toBe(true);
    expect(explanation.reasons.some((r) => r.includes("Recommendation:"))).toBe(
      true,
    );
    expect(explanation.reasonDetails.length).toBeGreaterThan(0);
  });

  it("adds workload warning", () => {
    const breakdown = buildWorkerScore({
      worker: worker("busy", { activeAssignments: 2 }),
      campaign: campaign(),
    });
    expect(breakdown.warnings.some((w) => /handling/i.test(w))).toBe(true);
  });
});

describe("AI confidence + fallback", () => {
  it("final score equals rule score when AI disabled", () => {
    const combined = combineRuleAndAiScore({
      ruleScore: 87,
      aiConfidence: 0.94,
      aiEnabled: false,
    });
    expect(combined.matchScore).toBe(87);
    expect(combined.aiAugmented).toBe(false);
  });

  it("augments rule score when AI enabled", () => {
    const combined = combineRuleAndAiScore({
      ruleScore: 87,
      aiConfidence: 0.94,
      aiEnabled: true,
    });
    expect(combined.matchScore).toBe(91);
    expect(combined.aiAugmented).toBe(true);
  });

  it("estimates confidence in range", () => {
    const breakdown = buildWorkerScore({
      worker: worker("x"),
      campaign: campaign(),
    });
    const conf = estimateAiConfidence({
      worker: worker("x"),
      breakdown,
    });
    expect(conf).toBeGreaterThanOrEqual(0.35);
    expect(conf).toBeLessThanOrEqual(0.99);
  });
});

describe("Fairness", () => {
  it("boosts new workers when enabled", () => {
    const camp = campaign();
    const veteran = worker("vet", { completedTasks: 80, organizationHistoryCount: 10 });
    const newbie = worker("new", {
      completedTasks: 1,
      organizationHistoryCount: 0,
      similarCampaignCompletions: 0,
      trustScore: 70,
      completionRate: 0.8,
      approvalRate: 0.8,
    });

    const vetScore = buildWorkerScore({ worker: veteran, campaign: camp });
    const newScore = buildWorkerScore({ worker: newbie, campaign: camp });

    const ranked = applyFairnessAdjustments({
      enabled: true,
      policy: resolveFairnessPolicy({ newWorkerBoost: 20 }),
      ranked: [
        {
          worker: veteran,
          recommendation: buildExplanation({
            worker: veteran,
            breakdown: vetScore,
            matchScore: vetScore.ruleScore,
            ruleScore: vetScore.ruleScore,
            aiConfidence: null,
            confidence: 0.9,
            explainabilityEnabled: true,
          }),
        },
        {
          worker: newbie,
          recommendation: buildExplanation({
            worker: newbie,
            breakdown: newScore,
            matchScore: newScore.ruleScore,
            ruleScore: newScore.ruleScore,
            aiConfidence: null,
            confidence: 0.8,
            explainabilityEnabled: true,
          }),
        },
      ],
    });

    const newRec = ranked.find((r) => r.worker.workerId === "new")!;
    expect(newRec.recommendation.matchScore).toBeGreaterThan(newScore.ruleScore);
    expect(
      newRec.recommendation.reasons.some((r) => /New worker boost/i.test(r)),
    ).toBe(true);
  });
});

describe("RankingEngine pipeline", () => {
  it("returns top recommendations with score confidence reasons warnings", async () => {
    const result = await rankWorkersDetailed({
      campaign: campaign(),
      pool: [
        worker("a"),
        worker("b", {
          trustScore: 90,
          completionRate: 0.99,
          organizationHistoryCount: 8,
        }),
        worker("c", { trustScore: 20 }), // ineligible
        worker("d", { countryCode: "GH" }), // rejected by candidate gen
      ],
      topN: 10,
      forceRuleOnly: true,
    });

    expect(result.advisoryOnly).toBe(true);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(result.recommendations.length).toBeLessThanOrEqual(10);
    expect(result.eligibleCount).toBe(2);
    expect(result.ineligibleCount).toBe(1);
    expect(result.rejectedCount).toBe(1);

    const top = result.recommendations[0]!;
    expect(top.matchScore).toBeGreaterThan(0);
    expect(top.confidence).toBeGreaterThan(0);
    expect(top.reasons.length).toBeGreaterThan(0);
    expect(Array.isArray(top.warnings)).toBe(true);

    expect(getRankingTelemetrySnapshot().requests).toBe(1);
  });

  it("falls back empty when match engine disabled", async () => {
    process.env.AI_MATCH_ENGINE = "false";
    const result = await rankWorkersDetailed({
      campaign: campaign(),
      pool: [worker("a")],
      forceRuleOnly: true,
    });
    expect(result.recommendations).toEqual([]);
    expect(result.fallbackUsed).toBe(true);
  });

  it("RankingEngine port ranks from knowledge snapshot", async () => {
    const result = await rankingEngine.rankWorkers({
      campaignId: "cmp_1",
      organizationId: "org_1",
      candidateWorkerIds: ["a", "b"],
      knowledgeSnapshot: {
        campaign: campaign(),
        workers: [worker("a"), worker("b")],
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.rankings.length).toBe(2);
    expect(result.modelVersion).toContain("match-engine");
  });
});
