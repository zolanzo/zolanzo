/**
 * Forecasting & Decision Intelligence — Phase 4.3C types.
 * Advisory only — never mutates domain data.
 */

export const FORECAST_ENGINE_MODEL_VERSION = "forecast-engine/1.0.0";

export const FORECAST_TYPES = [
  "campaign",
  "workforce",
  "finance",
  "trust",
  "reviews",
  "ai_operations",
] as const;

export type ForecastType = (typeof FORECAST_TYPES)[number];

export const FORECAST_RISK_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
  "unknown",
] as const;

export type ForecastRiskLevel = (typeof FORECAST_RISK_LEVELS)[number];

export type ForecastPrediction = {
  key: string;
  label: string;
  value: number | string | null;
  unit?: string | null;
  horizon?: string | null;
  riskLevel?: ForecastRiskLevel;
};

export type ForecastRecommendation = {
  id: string;
  title: string;
  action: string;
  priority: "low" | "medium" | "high";
  relatedPredictionKeys: string[];
  rationale: string;
};

export type ForecastInputSummary = {
  source: "analytics" | "trust" | "ai" | "operational";
  keys: string[];
  sampleSize: number;
  periodStart?: string | null;
  periodEnd?: string | null;
};

export type ForecastResult = {
  type: ForecastType;
  title: string;
  description: string;
  predictions: ForecastPrediction[];
  /** 0–100 overall confidence */
  confidence: number;
  confidenceBand: "low" | "medium" | "high";
  inputs: ForecastInputSummary[];
  modelVersion: string;
  recommendations: ForecastRecommendation[];
  riskLevel: ForecastRiskLevel;
  advisoryOnly: true;
  cached: boolean;
  generatedAt: string;
  lastRefreshAt: string;
  latencyMs: number;
  scope: {
    organizationId?: string | null;
    campaignId?: string | null;
    workerUserId?: string | null;
  };
};

export type ForecastRequest = {
  type: ForecastType;
  organizationId?: string | null;
  campaignId?: string | null;
  workerUserId?: string | null;
  permissions?: string[];
  refresh?: boolean;
  reference?: Date;
};

export type ForecastHealthCounters = {
  jobs: number;
  cacheHits: number;
  cacheMisses: number;
  failures: number;
  totalLatencyMs: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  byType: Record<string, number>;
  confidenceBuckets: Record<string, number>;
};
