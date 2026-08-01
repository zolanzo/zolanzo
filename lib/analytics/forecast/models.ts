/**
 * Prediction models — independently versioned, replaceable heuristics.
 * Consume Analytics / Trust / AI signals only. Never mutate domain.
 */

import {
  addUtcDaysIso,
  clampConfidence,
  confidenceFromSampleSize,
  etaDaysRemaining,
  highestRisk,
  riskFromProbability,
} from "@/lib/analytics/forecast/confidence";
import { FORECAST_ENGINE_MODEL_VERSION } from "@/lib/analytics/forecast/types";
import { metricSum, type ForecastDataContext } from "@/lib/analytics/forecast/data-context";
import type {
  ForecastPrediction,
  ForecastRiskLevel,
  ForecastType,
} from "@/lib/analytics/forecast/types";

export type ModelOutput = {
  type: ForecastType;
  modelVersion: string;
  predictions: ForecastPrediction[];
  confidence: number;
  riskLevel: ForecastRiskLevel;
  inputKeys: string[];
};

export type ForecastModel = {
  type: ForecastType;
  version: string;
  run: (ctx: ForecastDataContext, reference: Date) => ModelOutput;
};

function campaignModel(ctx: ForecastDataContext, reference: Date): ModelOutput {
  const created = metricSum(ctx.totals, "assignment.created.count");
  const completed = metricSum(ctx.totals, "assignment.completed.count");
  const remaining = Math.max(created - completed, 0);
  const dailyRate = completed / 7; // weekly window → daily
  const days = etaDaysRemaining(remaining, dailyRate);
  const eta =
    days == null ? null : addUtcDaysIso(reference, days);
  const completionRatio = created > 0 ? completed / created : 0;
  const slaProb = Math.min(
    0.95,
    Math.max(0, 1 - completionRatio) * (days != null && days > 14 ? 1.2 : 0.8),
  );
  const workerDemand = Math.max(0, Math.ceil(remaining * 0.35));
  const budgetUsed = metricSum(ctx.totals, "payment.completed.amount");
  const reviews = metricSum(ctx.totals, "review.completed.count");
  const reviewerGap = Math.max(0, Math.ceil(remaining / 20) - Math.ceil(reviews / 7));

  const predictions: ForecastPrediction[] = [
    {
      key: "campaign.completion_eta",
      label: "Estimated completion date",
      value: eta,
      unit: "date",
      horizon: days != null ? `${days}d` : null,
      riskLevel: days != null && days > 21 ? "high" : "medium",
    },
    {
      key: "campaign.completion_confidence",
      label: "Completion confidence",
      value: clampConfidence(confidenceFromSampleSize(ctx.sampleSize) * (dailyRate > 0 ? 1 : 0.5)),
      unit: "%",
    },
    {
      key: "campaign.sla_breach_probability",
      label: "SLA miss probability",
      value: Math.round(slaProb * 1000) / 1000,
      unit: "probability",
      riskLevel: riskFromProbability(slaProb),
    },
    {
      key: "campaign.worker_demand",
      label: "Workers still required",
      value: workerDemand,
      unit: "workers",
      riskLevel: workerDemand > 10 ? "high" : "low",
    },
    {
      key: "campaign.budget_usage",
      label: "Budget usage (paid)",
      value: budgetUsed,
      unit: "minor",
    },
    {
      key: "campaign.reviewer_capacity_gap",
      label: "Reviewer capacity gap",
      value: reviewerGap,
      unit: "reviewers",
      riskLevel: reviewerGap > 0 ? "medium" : "low",
    },
    {
      key: "campaign.regional_completion",
      label: "Regional completion",
      value: null,
      unit: null,
      horizon: "geo dimensions in later BI",
      riskLevel: "unknown",
    },
  ];

  return {
    type: "campaign",
    modelVersion: `${FORECAST_ENGINE_MODEL_VERSION}+campaign/1.0.0`,
    predictions,
    confidence: clampConfidence(
      confidenceFromSampleSize(ctx.sampleSize) -
        (dailyRate <= 0 ? 20 : 0),
    ),
    riskLevel: highestRisk(
      predictions.map((p) => p.riskLevel ?? "unknown"),
    ),
    inputKeys: [
      "assignment.created.count",
      "assignment.completed.count",
      "payment.completed.amount",
      "review.completed.count",
    ],
  };
}

function workforceModel(ctx: ForecastDataContext): ModelOutput {
  const assignments = metricSum(ctx.totals, "assignment.created.count");
  const completed = metricSum(ctx.totals, "assignment.completed.count");
  const acceptance =
    assignments > 0 ? Math.round((completed / Math.max(assignments, 1)) * 1000) / 10 : 50;
  const availability = Math.max(0, Math.round(assignments * 0.6));
  const shortageProb =
    assignments > completed * 1.5 ? 0.65 : assignments > 0 ? 0.25 : 0.4;

  const predictions: ForecastPrediction[] = [
    {
      key: "workforce.availability",
      label: "Worker availability (proxy)",
      value: availability,
      unit: "workers",
    },
    {
      key: "workforce.acceptance_probability",
      label: "Acceptance likelihood",
      value: acceptance,
      unit: "%",
    },
    {
      key: "workforce.assignment_completion",
      label: "Expected assignment completions (7d)",
      value: Math.round(completed * 1.05),
      unit: "assignments",
      horizon: "7d",
    },
    {
      key: "workforce.regional_capacity",
      label: "Regional capacity",
      value: null,
      horizon: "pending geo analytics",
      riskLevel: "unknown",
    },
    {
      key: "workforce.shortage_risk",
      label: "Upcoming shortage risk",
      value: Math.round(shortageProb * 1000) / 1000,
      unit: "probability",
      riskLevel: riskFromProbability(shortageProb),
    },
  ];

  return {
    type: "workforce",
    modelVersion: `${FORECAST_ENGINE_MODEL_VERSION}+workforce/1.0.0`,
    predictions,
    confidence: confidenceFromSampleSize(ctx.sampleSize),
    riskLevel: riskFromProbability(shortageProb),
    inputKeys: ["assignment.created.count", "assignment.completed.count"],
  };
}

function financeModel(ctx: ForecastDataContext): ModelOutput {
  const payoutCount = metricSum(ctx.totals, "payment.completed.count");
  const payoutAmount = metricSum(ctx.totals, "payment.completed.amount");
  const failed = metricSum(ctx.totals, "payment.failed.count");
  const weeklyPayout = Math.round(payoutAmount * 1.05);
  const backlog = Math.max(0, Math.round(failed * 2 + payoutCount * 0.1));
  const burnPerDay = payoutAmount / 7;

  const predictions: ForecastPrediction[] = [
    {
      key: "finance.weekly_payout",
      label: "Weekly payout volume",
      value: weeklyPayout,
      unit: "minor",
      horizon: "7d",
    },
    {
      key: "finance.settlement_backlog",
      label: "Settlement backlog signal",
      value: backlog,
      unit: "items",
      riskLevel: backlog > 10 ? "high" : "low",
    },
    {
      key: "finance.revenue_trend",
      label: "Revenue / payout trend",
      value: payoutAmount,
      unit: "minor",
      riskLevel: payoutAmount > 0 ? "low" : "medium",
    },
    {
      key: "finance.budget_burn_rate",
      label: "Budget burn (per day)",
      value: Math.round(burnPerDay),
      unit: "minor/day",
    },
    {
      key: "finance.wallet_liquidity",
      label: "Wallet liquidity (advisory)",
      value: Math.round(weeklyPayout * 1.2),
      unit: "minor",
      horizon: "recommended float",
    },
    {
      key: "finance.payment_throughput",
      label: "Payment throughput",
      value: Math.round(payoutCount / 7),
      unit: "payments/day",
    },
  ];

  return {
    type: "finance",
    modelVersion: `${FORECAST_ENGINE_MODEL_VERSION}+finance/1.0.0`,
    predictions,
    confidence: confidenceFromSampleSize(ctx.sampleSize + payoutCount),
    riskLevel: highestRisk(predictions.map((p) => p.riskLevel ?? "low")),
    inputKeys: [
      "payment.completed.count",
      "payment.completed.amount",
      "payment.failed.count",
    ],
  };
}

function trustModel(ctx: ForecastDataContext): ModelOutput {
  const rising = ctx.trust?.rising ?? 0;
  const falling = ctx.trust?.falling ?? 0;
  const avg = ctx.trust?.averageScore ?? 50;
  const profiles = ctx.trust?.profiles ?? 0;
  const verification = metricSum(ctx.totals, "trust.updated.count");
  const trajectory =
    rising > falling ? "improving" : falling > rising ? "declining" : "stable";
  const deteriorationProb =
    falling > rising * 1.5 ? 0.7 : falling > rising ? 0.45 : 0.15;

  const predictions: ForecastPrediction[] = [
    {
      key: "trust.improving_profiles",
      label: "Improving profiles",
      value: rising,
      unit: "profiles",
      riskLevel: "low",
    },
    {
      key: "trust.declining_profiles",
      label: "Declining profiles",
      value: falling,
      unit: "profiles",
      riskLevel: falling > 5 ? "high" : "low",
    },
    {
      key: "trust.verification_progress",
      label: "Identity verification progress",
      value: verification,
      unit: "updates",
    },
    {
      key: "trust.trajectory",
      label: "Trust trajectory",
      value: trajectory,
      riskLevel: trajectory === "declining" ? "medium" : "low",
    },
    {
      key: "trust.deterioration_risk",
      label: "High-risk trust deterioration",
      value: Math.round(deteriorationProb * 1000) / 1000,
      unit: "probability",
      riskLevel: riskFromProbability(deteriorationProb),
    },
    {
      key: "trust.average_score",
      label: "Average trust (current)",
      value: avg,
      unit: "score",
    },
  ];

  return {
    type: "trust",
    modelVersion: `${FORECAST_ENGINE_MODEL_VERSION}+trust/1.0.0`,
    predictions,
    confidence: clampConfidence(
      confidenceFromSampleSize(profiles || ctx.sampleSize),
    ),
    riskLevel: riskFromProbability(deteriorationProb),
    inputKeys: [
      "trust.telemetry",
      "trust.updated.count",
    ],
  };
}

function reviewsModel(ctx: ForecastDataContext): ModelOutput {
  const reviews = metricSum(ctx.totals, "review.completed.count");
  const assignments = metricSum(ctx.totals, "assignment.created.count");
  const queueGrowth = Math.max(0, assignments - reviews);
  const avgDelayHours =
    reviews > 0 ? Math.round((queueGrowth / Math.max(reviews, 1)) * 8 * 10) / 10 : 24;
  const slaProb = Math.min(0.95, queueGrowth / Math.max(assignments, 1));
  const utilization =
    reviews > 0 ? Math.min(100, Math.round((reviews / Math.max(reviews + queueGrowth, 1)) * 100)) : 40;

  const predictions: ForecastPrediction[] = [
    {
      key: "reviews.queue_growth",
      label: "Review queue growth",
      value: queueGrowth,
      unit: "items",
      riskLevel: queueGrowth > 20 ? "high" : "low",
    },
    {
      key: "reviews.average_review_time",
      label: "Average review delay",
      value: avgDelayHours,
      unit: "hours",
      riskLevel: avgDelayHours > 24 ? "medium" : "low",
    },
    {
      key: "reviews.sla_breach_probability",
      label: "SLA breach probability",
      value: Math.round(slaProb * 1000) / 1000,
      unit: "probability",
      riskLevel: riskFromProbability(slaProb),
    },
    {
      key: "reviews.reviewer_utilization",
      label: "Reviewer utilization",
      value: utilization,
      unit: "%",
    },
  ];

  return {
    type: "reviews",
    modelVersion: `${FORECAST_ENGINE_MODEL_VERSION}+reviews/1.0.0`,
    predictions,
    confidence: confidenceFromSampleSize(ctx.sampleSize + reviews),
    riskLevel: riskFromProbability(slaProb),
    inputKeys: ["review.completed.count", "assignment.created.count"],
  };
}

function aiOperationsModel(ctx: ForecastDataContext): ModelOutput {
  const requests = ctx.ai?.requests ?? 0;
  const tokens = ctx.ai?.totalTokens ?? 0;
  const cost = ctx.ai?.totalCostMicroUsd ?? 0;
  const latency = ctx.ai?.avgLatencyMs ?? 0;
  const monthlyCost = Math.round(cost * 30);
  const monthlyTokens = Math.round(tokens * 30);
  const growth = Math.round(requests * 1.1);
  const ruleShare = ctx.ai?.byProvider?.mock
    ? Math.round(
        ((ctx.ai.byProvider.mock.requests || 0) /
          Math.max(requests, 1)) *
          100,
      )
    : requests === 0
      ? 100
      : 50;

  const predictions: ForecastPrediction[] = [
    {
      key: "ai.token_usage",
      label: "Projected monthly tokens",
      value: monthlyTokens,
      unit: "tokens",
      horizon: "30d",
    },
    {
      key: "ai.request_growth",
      label: "AI request growth",
      value: growth,
      unit: "requests",
      horizon: "next window",
    },
    {
      key: "ai.latency_trend",
      label: "Average latency",
      value: latency,
      unit: "ms",
      riskLevel: latency > 2000 ? "high" : latency > 1000 ? "medium" : "low",
    },
    {
      key: "ai.monthly_cost_estimate",
      label: "Estimated monthly AI cost",
      value: monthlyCost,
      unit: "µUSD",
      horizon: "30d",
    },
    {
      key: "ai.rule_vs_ai_trend",
      label: "Rule-path share",
      value: ruleShare,
      unit: "%",
    },
  ];

  return {
    type: "ai_operations",
    modelVersion: `${FORECAST_ENGINE_MODEL_VERSION}+ai/1.0.0`,
    predictions,
    confidence: confidenceFromSampleSize(requests || ctx.sampleSize),
    riskLevel: highestRisk(predictions.map((p) => p.riskLevel ?? "low")),
    inputKeys: ["ai.telemetry"],
  };
}

export const FORECAST_MODELS: ForecastModel[] = [
  {
    type: "campaign",
    version: "campaign/1.0.0",
    run: (ctx, ref) => campaignModel(ctx, ref),
  },
  {
    type: "workforce",
    version: "workforce/1.0.0",
    run: (ctx) => workforceModel(ctx),
  },
  {
    type: "finance",
    version: "finance/1.0.0",
    run: (ctx) => financeModel(ctx),
  },
  {
    type: "trust",
    version: "trust/1.0.0",
    run: (ctx) => trustModel(ctx),
  },
  {
    type: "reviews",
    version: "reviews/1.0.0",
    run: (ctx) => reviewsModel(ctx),
  },
  {
    type: "ai_operations",
    version: "ai/1.0.0",
    run: (ctx) => aiOperationsModel(ctx),
  },
];
