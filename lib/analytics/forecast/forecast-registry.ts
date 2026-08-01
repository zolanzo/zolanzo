/**
 * ForecastRegistry — independently versioned prediction models.
 */

import { FORECAST_MODELS, type ForecastModel } from "@/lib/analytics/forecast/models";
import type { ForecastType } from "@/lib/analytics/forecast/types";

const registry = new Map<ForecastType, ForecastModel>(
  FORECAST_MODELS.map((m) => [m.type, m]),
);

export function getForecastModel(type: ForecastType): ForecastModel | undefined {
  return registry.get(type);
}

export function listForecastModels(): ForecastModel[] {
  return [...registry.values()];
}

export function registerForecastModel(model: ForecastModel): void {
  registry.set(model.type, model);
}

export const ForecastRegistry = {
  get: getForecastModel,
  list: listForecastModels,
  register: registerForecastModel,
};
