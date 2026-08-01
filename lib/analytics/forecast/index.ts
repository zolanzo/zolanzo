/**
 * Forecasting & Decision Intelligence — Phase 4.3C exports.
 */

export {
  FORECAST_ENGINE_MODEL_VERSION,
  FORECAST_TYPES,
  FORECAST_RISK_LEVELS,
  type ForecastType,
  type ForecastRiskLevel,
  type ForecastPrediction,
  type ForecastRecommendation,
  type ForecastResult,
  type ForecastRequest,
  type ForecastInputSummary,
} from "@/lib/analytics/forecast/types";

export {
  isForecastEngineEnabled,
  isForecastRecommendationsEnabled,
  isForecastModelsEnabled,
  FORECAST_CACHE_TTL_MS,
} from "@/lib/analytics/forecast/config";

export {
  ForecastService,
  getForecast,
  refreshForecast,
  listAvailableForecasts,
} from "@/lib/analytics/forecast/forecast-service";

export { ForecastEngine, runForecast } from "@/lib/analytics/forecast/forecast-engine";

export {
  ForecastRegistry,
  getForecastModel,
  listForecastModels,
  registerForecastModel,
} from "@/lib/analytics/forecast/forecast-registry";

export {
  RecommendationBuilder,
  buildRecommendations,
} from "@/lib/analytics/forecast/recommendation-builder";

export {
  ForecastCache,
  invalidateForecastCache,
  getForecastCacheStats,
  resetForecastCacheForTests,
} from "@/lib/analytics/forecast/cache";

export {
  getForecastTelemetrySnapshot,
  resetForecastTelemetryForTests,
} from "@/lib/analytics/forecast/telemetry";

export {
  canAccessForecast,
  filterRecommendationsByPermission,
} from "@/lib/analytics/forecast/permissions";

export {
  clampConfidence,
  confidenceFromSampleSize,
  confidenceBand,
} from "@/lib/analytics/forecast/confidence";

export { getForecastSnippetForCopilot } from "@/lib/analytics/forecast/copilot-bridge";
export type { ForecastCopilotSnippet } from "@/lib/analytics/forecast/copilot-bridge";
