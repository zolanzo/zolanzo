/**
 * Phase 4.3C — Forecasting & Decision Intelligence tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AnalyticsService,
  setAnalyticsBackend,
  resetAnalyticsMemoryStoreForTests,
  resetAnalyticsTelemetryForTests,
} from "@/lib/analytics";
import {
  ForecastService,
  ForecastRegistry,
  RecommendationBuilder,
  ForecastCache,
  resetForecastCacheForTests,
  resetForecastTelemetryForTests,
  getForecastTelemetrySnapshot,
  isForecastEngineEnabled,
  isForecastRecommendationsEnabled,
  isForecastModelsEnabled,
  confidenceFromSampleSize,
  canAccessForecast,
  filterRecommendationsByPermission,
  FORECAST_ENGINE_MODEL_VERSION,
  getForecastSnippetForCopilot,
} from "@/lib/analytics/forecast";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetAnalyticsMemoryStoreForTests();
  resetAnalyticsTelemetryForTests();
  resetForecastCacheForTests();
  resetForecastTelemetryForTests();
  setAnalyticsBackend("memory");
  process.env = { ...ORIGINAL_ENV };
  delete process.env.FORECAST_ENGINE;
  delete process.env.FORECAST_RECOMMENDATIONS;
  delete process.env.FORECAST_MODELS;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults forecast engine on", () => {
    expect(isForecastEngineEnabled()).toBe(true);
    expect(isForecastRecommendationsEnabled()).toBe(true);
    expect(isForecastModelsEnabled()).toBe(true);
  });

  it("respects FORECAST_ENGINE=0", async () => {
    process.env.FORECAST_ENGINE = "0";
    expect(await ForecastService.get({ type: "campaign" })).toBeNull();
  });

  it("respects FORECAST_MODELS=0", async () => {
    process.env.FORECAST_MODELS = "0";
    expect(await ForecastService.get({ type: "finance" })).toBeNull();
  });
});

describe("forecast generation", () => {
  it("generates campaign forecast with advisoryOnly", async () => {
    await AnalyticsService.record({
      source: "assignments",
      eventType: "assignment.created",
      idempotencyKey: "a1",
      occurredAt: new Date().toISOString(),
    });
    await AnalyticsService.record({
      source: "assignments",
      eventType: "assignment.completed",
      idempotencyKey: "a2",
      occurredAt: new Date().toISOString(),
    });

    const result = await ForecastService.get({ type: "campaign" });
    expect(result).not.toBeNull();
    expect(result?.advisoryOnly).toBe(true);
    expect(result?.modelVersion).toContain(FORECAST_ENGINE_MODEL_VERSION);
    expect(result?.predictions.some((p) => p.key === "campaign.completion_eta")).toBe(
      true,
    );
    expect(result?.confidence).toBeGreaterThanOrEqual(0);
    expect(result?.confidence).toBeLessThanOrEqual(100);
    expect(result?.inputs.length).toBeGreaterThan(0);
  });

  it("generates all forecast types", async () => {
    for (const type of ForecastRegistry.list().map((m) => m.type)) {
      const result = await ForecastService.get({ type, refresh: true });
      expect(result?.type).toBe(type);
      expect(result?.advisoryOnly).toBe(true);
      expect(result?.predictions.length).toBeGreaterThan(0);
    }
  });
});

describe("confidence calculation", () => {
  it("scales with sample size", () => {
    expect(confidenceFromSampleSize(0)).toBeLessThan(
      confidenceFromSampleSize(50),
    );
    expect(confidenceFromSampleSize(200)).toBe(90);
  });
});

describe("caching", () => {
  it("hits cache on second get", async () => {
    const first = await ForecastService.get({ type: "workforce" });
    const second = await ForecastService.get({ type: "workforce" });
    expect(first?.cached).toBe(false);
    expect(second?.cached).toBe(true);
    expect(ForecastCache.stats().hits).toBeGreaterThan(0);
    expect(getForecastTelemetrySnapshot().jobs).toBeGreaterThanOrEqual(2);
  });
});

describe("recommendation generation", () => {
  it("builds recommendations when enabled", () => {
    const recs = RecommendationBuilder.build({
      type: "campaign",
      riskLevel: "high",
      predictions: [
        {
          key: "campaign.sla_breach_probability",
          label: "SLA",
          value: 0.7,
          unit: "probability",
          riskLevel: "high",
        },
        {
          key: "campaign.worker_demand",
          label: "Demand",
          value: 12,
          unit: "workers",
        },
      ],
    });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.relatedPredictionKeys.length).toBeGreaterThan(0);
  });

  it("skips recommendations when FORECAST_RECOMMENDATIONS=0", () => {
    process.env.FORECAST_RECOMMENDATIONS = "0";
    const recs = RecommendationBuilder.build({
      type: "finance",
      riskLevel: "medium",
      predictions: [
        {
          key: "finance.budget_burn_rate",
          label: "Burn",
          value: 1000,
        },
      ],
    });
    expect(recs).toHaveLength(0);
  });
});

describe("permission filtering", () => {
  it("allows analytics.read", () => {
    expect(canAccessForecast("campaign", ["analytics.read"])).toBe(true);
  });

  it("strips admin-only recommendations", async () => {
    const result = await ForecastService.get({
      type: "finance",
      permissions: ["analytics.read"],
      refresh: true,
    });
    const { recommendations, filtered } = filterRecommendationsByPermission(
      [
        { id: "finance.budget_settlement_funds" },
        { id: "finance.clear_settlement_backlog" },
      ],
      ["analytics.read"],
    );
    expect(filtered).toBe(true);
    expect(recommendations).toHaveLength(1);
    expect(
      result?.recommendations.every(
        (r) => r.id !== "finance.budget_settlement_funds",
      ),
    ).toBe(true);
  });
});

describe("copilot bridge", () => {
  it("returns advisory snippets", async () => {
    const snippet = await getForecastSnippetForCopilot({ type: "ai_operations" });
    expect(snippet?.advisoryOnly).toBe(true);
    expect(snippet?.summary).toContain("confidence");
  });
});
