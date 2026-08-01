/**
 * RecommendationBuilder — practical actions tied to predictions.
 */

import { isForecastRecommendationsEnabled } from "@/lib/analytics/forecast/config";
import type {
  ForecastPrediction,
  ForecastRecommendation,
  ForecastRiskLevel,
  ForecastType,
} from "@/lib/analytics/forecast/types";

export function buildRecommendations(params: {
  type: ForecastType;
  predictions: ForecastPrediction[];
  riskLevel: ForecastRiskLevel;
}): ForecastRecommendation[] {
  if (!isForecastRecommendationsEnabled()) return [];

  const byKey = new Map(params.predictions.map((p) => [p.key, p]));
  const out: ForecastRecommendation[] = [];

  const push = (rec: ForecastRecommendation) => {
    out.push(rec);
  };

  if (params.type === "campaign") {
    const sla = byKey.get("campaign.sla_breach_probability");
    const demand = byKey.get("campaign.worker_demand");
    if (
      sla &&
      typeof sla.value === "number" &&
      sla.value >= 0.4
    ) {
      push({
        id: "campaign.increase_reviewers",
        title: "Increase reviewer capacity",
        action: "Add reviewers or reduce review SLA target for this campaign.",
        priority: sla.value >= 0.6 ? "high" : "medium",
        relatedPredictionKeys: ["campaign.sla_breach_probability"],
        rationale: `SLA breach probability is ${(sla.value * 100).toFixed(0)}%.`,
      });
    }
    if (demand && typeof demand.value === "number" && demand.value > 0) {
      push({
        id: "campaign.recruit_workers",
        title: "Recruit more workers",
        action: `Source ~${demand.value} additional workers for this campaign.`,
        priority: "high",
        relatedPredictionKeys: ["campaign.worker_demand", "campaign.completion_eta"],
        rationale: "Projected worker demand exceeds current completion pace.",
      });
    }
  }

  if (params.type === "workforce") {
    const shortage = byKey.get("workforce.shortage_risk");
    if (
      shortage &&
      (shortage.riskLevel === "high" || shortage.riskLevel === "critical")
    ) {
      push({
        id: "workforce.expand_regions",
        title: "Expand regional capacity",
        action: "Open recruiting in underperforming regions before peak demand.",
        priority: "high",
        relatedPredictionKeys: ["workforce.shortage_risk", "workforce.availability"],
        rationale: "Workforce shortage risk is elevated.",
      });
    }
  }

  if (params.type === "finance") {
    const burn = byKey.get("finance.budget_burn_rate");
    const backlog = byKey.get("finance.settlement_backlog");
    if (burn && typeof burn.value === "number" && burn.value > 0) {
      push({
        id: "finance.budget_settlement_funds",
        title: "Budget additional settlement funds",
        action: "Increase weekly settlement float to cover projected payout volume.",
        priority: "medium",
        relatedPredictionKeys: ["finance.budget_burn_rate", "finance.weekly_payout"],
        rationale: "Projected payout burn requires liquidity headroom.",
      });
    }
    if (backlog && typeof backlog.value === "number" && backlog.value > 10) {
      push({
        id: "finance.clear_settlement_backlog",
        title: "Clear settlement backlog",
        action: "Prioritize settlement processing for pending payouts.",
        priority: "high",
        relatedPredictionKeys: ["finance.settlement_backlog"],
        rationale: `Estimated backlog signal: ${backlog.value}.`,
      });
    }
  }

  if (params.type === "trust") {
    const declining = byKey.get("trust.declining_profiles");
    if (declining && typeof declining.value === "number" && declining.value > 0) {
      push({
        id: "trust.prioritize_identity",
        title: "Prioritize identity verification",
        action: "Prompt new and declining workers to complete identity verification.",
        priority: "medium",
        relatedPredictionKeys: [
          "trust.declining_profiles",
          "trust.verification_progress",
        ],
        rationale: "Declining trust profiles benefit from verified identity signals.",
      });
    }
  }

  if (params.type === "reviews") {
    const breach = byKey.get("reviews.sla_breach_probability");
    if (
      breach &&
      typeof breach.value === "number" &&
      breach.value >= 0.35
    ) {
      push({
        id: "reviews.scale_reviewers",
        title: "Scale reviewer utilization",
        action: "Increase active reviewers or redistribute queue load.",
        priority: breach.value >= 0.55 ? "high" : "medium",
        relatedPredictionKeys: [
          "reviews.sla_breach_probability",
          "reviews.queue_growth",
        ],
        rationale: `Review SLA breach probability is ${(breach.value * 100).toFixed(0)}%.`,
      });
    }
  }

  if (params.type === "ai_operations") {
    const cost = byKey.get("ai.monthly_cost_estimate");
    const latency = byKey.get("ai.latency_trend");
    if (cost && typeof cost.value === "number" && cost.value > 0) {
      push({
        id: "ai.control_spend",
        title: "Monitor AI operating cost",
        action: "Review rule-vs-AI routing to contain monthly token spend.",
        priority: "medium",
        relatedPredictionKeys: ["ai.monthly_cost_estimate", "ai.token_usage"],
        rationale: "Projected monthly AI cost is rising with request volume.",
      });
    }
    if (
      latency &&
      typeof latency.value === "number" &&
      latency.value > 1500
    ) {
      push({
        id: "ai.reduce_latency",
        title: "Reduce AI latency",
        action: "Prefer rule paths for low-risk work; cache frequent prompts.",
        priority: "medium",
        relatedPredictionKeys: ["ai.latency_trend"],
        rationale: `Average latency forecast exceeds 1500 ms (${latency.value} ms).`,
      });
    }
  }

  if (params.riskLevel === "critical" && out.length === 0) {
    push({
      id: `${params.type}.review_risk`,
      title: "Review elevated forecast risk",
      action: "Investigate inputs and operational alerts for this forecast domain.",
      priority: "high",
      relatedPredictionKeys: params.predictions.map((p) => p.key).slice(0, 3),
      rationale: "Overall forecast risk is critical.",
    });
  }

  return out;
}

export const RecommendationBuilder = {
  build: buildRecommendations,
};
