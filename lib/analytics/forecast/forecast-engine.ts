/**
 * ForecastEngine — runs registered models against Analytics/Trust/AI inputs.
 * Advisory only. Never mutates domain data.
 */

import {
  isForecastEngineEnabled,
  isForecastModelsEnabled,
  FORECAST_ENGINE_MODEL_VERSION,
} from "@/lib/analytics/forecast/config";
import { confidenceBand } from "@/lib/analytics/forecast/confidence";
import { loadForecastDataContext } from "@/lib/analytics/forecast/data-context";
import { getForecastModel } from "@/lib/analytics/forecast/forecast-registry";
import { buildRecommendations } from "@/lib/analytics/forecast/recommendation-builder";
import {
  canAccessForecast,
  filterRecommendationsByPermission,
} from "@/lib/analytics/forecast/permissions";
import type {
  ForecastRequest,
  ForecastResult,
  ForecastType,
} from "@/lib/analytics/forecast/types";

const TITLES: Record<
  ForecastType,
  { title: string; description: string }
> = {
  campaign: {
    title: "Campaign Forecast",
    description: "Completion ETA, SLA risk, worker demand, budget usage",
  },
  workforce: {
    title: "Workforce Forecast",
    description: "Availability, acceptance, capacity, shortages",
  },
  finance: {
    title: "Finance Forecast",
    description: "Payout volume, backlog, burn, liquidity, throughput",
  },
  trust: {
    title: "Trust Forecast",
    description: "Trajectory, verification, deterioration risk",
  },
  reviews: {
    title: "Review Operations Forecast",
    description: "Queue growth, delay, SLA breach, utilization",
  },
  ai_operations: {
    title: "AI Operations Forecast",
    description: "Tokens, latency, cost, rule vs AI trend",
  },
};

export async function runForecast(
  request: ForecastRequest,
): Promise<ForecastResult | null> {
  if (!isForecastEngineEnabled() || !isForecastModelsEnabled()) return null;
  if (!canAccessForecast(request.type, request.permissions)) return null;

  const started = Date.now();
  const model = getForecastModel(request.type);
  if (!model) return null;

  const ctx = await loadForecastDataContext(request);
  const reference = request.reference ?? new Date();
  const output = model.run(ctx, reference);
  const meta = TITLES[request.type];

  let recommendations = buildRecommendations({
    type: request.type,
    predictions: output.predictions,
    riskLevel: output.riskLevel,
  });
  const filtered = filterRecommendationsByPermission(
    recommendations,
    request.permissions,
  );
  recommendations = filtered.recommendations;

  const generatedAt = new Date().toISOString();
  return {
    type: request.type,
    title: meta.title,
    description: meta.description,
    predictions: output.predictions,
    confidence: output.confidence,
    confidenceBand: confidenceBand(output.confidence),
    inputs: [
      {
        source: "analytics",
        keys: output.inputKeys.filter((k) => !k.startsWith("ai.") && k !== "trust.telemetry"),
        sampleSize: ctx.sampleSize,
        periodStart: ctx.periodStart,
        periodEnd: ctx.periodEnd,
      },
      ...(request.type === "trust" || output.inputKeys.includes("trust.telemetry")
        ? [
            {
              source: "trust" as const,
              keys: ["trust.telemetry"],
              sampleSize: ctx.trust?.profiles ?? 0,
            },
          ]
        : []),
      ...(request.type === "ai_operations"
        ? [
            {
              source: "ai" as const,
              keys: ["ai.telemetry"],
              sampleSize: ctx.ai?.requests ?? 0,
            },
          ]
        : []),
    ],
    modelVersion: output.modelVersion || FORECAST_ENGINE_MODEL_VERSION,
    recommendations,
    riskLevel: output.riskLevel,
    advisoryOnly: true,
    cached: false,
    generatedAt,
    lastRefreshAt: generatedAt,
    latencyMs: Date.now() - started,
    scope: {
      organizationId: request.organizationId ?? null,
      campaignId: request.campaignId ?? null,
      workerUserId: request.workerUserId ?? null,
    },
  };
}

export const ForecastEngine = {
  run: runForecast,
};
