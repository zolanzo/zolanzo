/**
 * Forecast runtime flags — Phase 4.3C.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch. Default: on. */
export function isForecastEngineEnabled(): boolean {
  if (falsy(process.env.FORECAST_ENGINE)) return false;
  if (truthy(process.env.FORECAST_ENGINE)) return true;
  return true;
}

/** Recommendation generation. Default: on when engine on. */
export function isForecastRecommendationsEnabled(): boolean {
  if (!isForecastEngineEnabled()) return false;
  if (falsy(process.env.FORECAST_RECOMMENDATIONS)) return false;
  if (truthy(process.env.FORECAST_RECOMMENDATIONS)) return true;
  return true;
}

/** Prediction model execution. Default: on when engine on. */
export function isForecastModelsEnabled(): boolean {
  if (!isForecastEngineEnabled()) return false;
  if (falsy(process.env.FORECAST_MODELS)) return false;
  if (truthy(process.env.FORECAST_MODELS)) return true;
  return true;
}

export const FORECAST_CACHE_TTL_MS = (() => {
  const raw = Number(process.env.FORECAST_CACHE_TTL_MS ?? "120000");
  return Number.isFinite(raw) && raw > 0 ? raw : 120_000;
})();

export { FORECAST_ENGINE_MODEL_VERSION } from "@/lib/analytics/forecast/types";
