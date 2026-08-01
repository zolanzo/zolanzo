/**
 * Admin Forecast Health — decision intelligence observability (4.3C).
 */

import "server-only";

import {
  isForecastEngineEnabled,
  isForecastRecommendationsEnabled,
  isForecastModelsEnabled,
  FORECAST_ENGINE_MODEL_VERSION,
  FORECAST_CACHE_TTL_MS,
} from "@/lib/analytics/forecast/config";
import { getForecastCacheStats } from "@/lib/analytics/forecast/cache";
import { getForecastTelemetrySnapshot } from "@/lib/analytics/forecast/telemetry";
import { listForecastModels } from "@/lib/analytics/forecast/forecast-registry";

export type ForecastHealthSnapshot = {
  forecastEngineEnabled: boolean;
  recommendationsEnabled: boolean;
  modelsEnabled: boolean;
  modelVersion: string;
  registeredModels: number;
  jobs: number;
  averageLatencyMs: number;
  predictionFreshnessMs: number | null;
  confidenceDistribution: Record<string, number>;
  failures: number;
  errorRate: number;
  cacheHitRate: number;
  cacheSize: number;
  cacheTtlMs: number;
  byType: Record<string, number>;
  generatedAt: string;
};

export async function getForecastHealthSnapshot(): Promise<ForecastHealthSnapshot> {
  const telemetry = getForecastTelemetrySnapshot();
  const cache = getForecastCacheStats();

  return {
    forecastEngineEnabled: isForecastEngineEnabled(),
    recommendationsEnabled: isForecastRecommendationsEnabled(),
    modelsEnabled: isForecastModelsEnabled(),
    modelVersion: FORECAST_ENGINE_MODEL_VERSION,
    registeredModels: listForecastModels().length,
    jobs: telemetry.jobs,
    averageLatencyMs: telemetry.averageLatencyMs,
    predictionFreshnessMs: telemetry.lastAt
      ? Math.max(0, Date.now() - new Date(telemetry.lastAt).getTime())
      : null,
    confidenceDistribution: telemetry.confidenceBuckets,
    failures: telemetry.failures,
    errorRate: Math.round(telemetry.errorRate * 1000) / 1000,
    cacheHitRate: Math.round(telemetry.cacheHitRate * 1000) / 1000,
    cacheSize: cache.size,
    cacheTtlMs: FORECAST_CACHE_TTL_MS,
    byType: telemetry.byType,
    generatedAt: new Date().toISOString(),
  };
}
