/**
 * Admin Fraud Health — advisory risk engine observability.
 */

import "server-only";

import {
  isFraudDetectionEnabled,
  isFraudExplainabilityEnabled,
  isDuplicateAnalysisEnabled,
  isGeoAnalysisEnabled,
  shouldRunAiRiskAnalyzer,
  FRAUD_ENGINE_MODEL_VERSION,
} from "@/lib/ai/fraud/fraud-config";
import { getFraudTelemetrySnapshot } from "@/lib/ai/fraud/fraud-telemetry";
import { isAiEnabled } from "@/lib/ai/config";

export type FraudHealthSnapshot = {
  fraudDetectionEnabled: boolean;
  explainabilityEnabled: boolean;
  duplicateAnalysisEnabled: boolean;
  geoAnalysisEnabled: boolean;
  aiEnabled: boolean;
  aiAugmentEnabled: boolean;
  modelVersion: string;
  assessmentsToday: number;
  highRiskCount: number;
  averageScore: number;
  averageLatencyMs: number;
  lastLatencyMs: number | null;
  aiAugmentedAssessments: number;
  ruleOnlyAssessments: number;
  aiVsRuleRatio: number;
  falsePositiveReviewRate: number | null;
  failures: number;
  requests: number;
  generatedAt: string;
};

export async function getFraudHealthSnapshot(): Promise<FraudHealthSnapshot> {
  const telemetry = getFraudTelemetrySnapshot();
  return {
    fraudDetectionEnabled: isFraudDetectionEnabled(),
    explainabilityEnabled: isFraudExplainabilityEnabled(),
    duplicateAnalysisEnabled: isDuplicateAnalysisEnabled(),
    geoAnalysisEnabled: isGeoAnalysisEnabled(),
    aiEnabled: isAiEnabled(),
    aiAugmentEnabled: shouldRunAiRiskAnalyzer(),
    modelVersion: FRAUD_ENGINE_MODEL_VERSION,
    assessmentsToday: telemetry.assessmentsToday,
    highRiskCount: telemetry.highRiskCount,
    averageScore: telemetry.averageScore,
    averageLatencyMs: telemetry.averageLatencyMs,
    lastLatencyMs: telemetry.lastLatencyMs,
    aiAugmentedAssessments: telemetry.aiAugmentCount,
    ruleOnlyAssessments: telemetry.ruleOnlyCount,
    aiVsRuleRatio: telemetry.aiVsRuleRatio,
    falsePositiveReviewRate: telemetry.falsePositiveReviewRate,
    failures: telemetry.failures,
    requests: telemetry.requests,
    generatedAt: new Date().toISOString(),
  };
}
