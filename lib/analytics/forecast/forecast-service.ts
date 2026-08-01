/**
 * ForecastService — public API for Forecasting & Decision Intelligence.
 */

import {
  isForecastEngineEnabled,
  isForecastModelsEnabled,
} from "@/lib/analytics/forecast/config";
import {
  ForecastCache,
  forecastCacheKey,
  invalidateForecastCache,
} from "@/lib/analytics/forecast/cache";
import { runForecast } from "@/lib/analytics/forecast/forecast-engine";
import { recordForecastJob } from "@/lib/analytics/forecast/telemetry";
import { FORECAST_TYPES } from "@/lib/analytics/forecast/types";
import type {
  ForecastRequest,
  ForecastResult,
  ForecastType,
} from "@/lib/analytics/forecast/types";
import { canAccessForecast } from "@/lib/analytics/forecast/permissions";

export async function getForecast(
  request: ForecastRequest,
): Promise<ForecastResult | null> {
  if (!isForecastEngineEnabled() || !isForecastModelsEnabled()) return null;
  if (!canAccessForecast(request.type, request.permissions)) return null;

  const key = forecastCacheKey({
    type: request.type,
    organizationId: request.organizationId,
    campaignId: request.campaignId,
    workerUserId: request.workerUserId,
  });

  if (!request.refresh) {
    const cached = ForecastCache.get(key);
    if (cached) {
      recordForecastJob({
        type: request.type,
        success: true,
        cacheHit: true,
        latencyMs: cached.latencyMs,
        confidence: cached.confidence,
      });
      return cached;
    }
  }

  try {
    const result = await runForecast(request);
    if (!result) {
      recordForecastJob({
        type: request.type,
        success: false,
        cacheHit: false,
        latencyMs: 0,
      });
      return null;
    }
    recordForecastJob({
      type: request.type,
      success: true,
      cacheHit: false,
      latencyMs: result.latencyMs,
      confidence: result.confidence,
    });
    ForecastCache.set(key, result);
    return result;
  } catch {
    recordForecastJob({
      type: request.type,
      success: false,
      cacheHit: false,
      latencyMs: 0,
    });
    return null;
  }
}

export async function refreshForecast(
  request: Omit<ForecastRequest, "refresh">,
): Promise<ForecastResult | null> {
  return getForecast({ ...request, refresh: true });
}

export function listAvailableForecasts(
  permissions?: string[],
): ForecastType[] {
  if (!isForecastEngineEnabled()) return [];
  return FORECAST_TYPES.filter((type) => canAccessForecast(type, permissions));
}

export const ForecastService = {
  get: getForecast,
  refresh: refreshForecast,
  list: listAvailableForecasts,
  invalidateCache: invalidateForecastCache,
};
