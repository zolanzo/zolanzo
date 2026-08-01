/**
 * Copilot bridge — advisory forecast snippets for Org / Worker copilots.
 * Never mutates domain. Never claims to take action.
 */

import { getForecast } from "@/lib/analytics/forecast/forecast-service";
import type { ForecastType } from "@/lib/analytics/forecast/types";

export type ForecastCopilotSnippet = {
  type: ForecastType;
  summary: string;
  recommendations: string[];
  confidence: number;
  advisoryOnly: true;
};

export async function getForecastSnippetForCopilot(params: {
  type: ForecastType;
  organizationId?: string | null;
  campaignId?: string | null;
  workerUserId?: string | null;
}): Promise<ForecastCopilotSnippet | null> {
  const result = await getForecast({
    type: params.type,
    organizationId: params.organizationId,
    campaignId: params.campaignId,
    workerUserId: params.workerUserId,
  });
  if (!result) return null;

  const top = result.predictions.slice(0, 3)
    .map((p) => `${p.label}: ${p.value ?? "n/a"}${p.unit ? ` ${p.unit}` : ""}`)
    .join("; ");

  return {
    type: result.type,
    summary: `${result.title} (confidence ${result.confidence}%): ${top}`,
    recommendations: result.recommendations.map((r) => r.action),
    confidence: result.confidence,
    advisoryOnly: true,
  };
}
