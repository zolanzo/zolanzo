/**
 * FraudDetector — Phase 4.1C AI Fraud Detection Engine.
 * Advisory only — never mutates business data.
 */

export type {
  FraudDetector,
  FraudDetectionInput,
  FraudDetectionResult,
} from "@/lib/ai/types";

export type {
  FraudAssessment,
  FraudEvidenceBundle,
  FraudRiskLevel,
  FraudSuggestedAction,
  FraudRiskFinding,
} from "@/lib/ai/fraud/fraud-types";

export {
  collectFraudEvidence,
  parseGpsSnapshot,
  parseDeviceSnapshot,
} from "@/lib/ai/fraud/evidence-collector";
export { evaluateRuleRisk, haversineKm } from "@/lib/ai/fraud/rule-risk-engine";
export { analyzeAiRisk } from "@/lib/ai/fraud/ai-risk-analyzer";
export {
  aggregateRisk,
  riskLevelFromScore,
} from "@/lib/ai/fraud/risk-aggregator";
export {
  buildFraudExplanation,
  suggestActions,
} from "@/lib/ai/fraud/explanation-builder";
export {
  fraudDetector,
  fraudDetectorStub,
  assessSubmissionFraud,
} from "@/lib/ai/fraud/fraud-detector";
export {
  getFraudTelemetrySnapshot,
  resetFraudTelemetryForTests,
  recordFraudTelemetry,
  recordFraudReviewFeedback,
} from "@/lib/ai/fraud/fraud-telemetry";
export {
  isFraudDetectionEnabled,
  isFraudExplainabilityEnabled,
  isDuplicateAnalysisEnabled,
  isGeoAnalysisEnabled,
  shouldRunAiRiskAnalyzer,
  FRAUD_ENGINE_MODEL_VERSION,
} from "@/lib/ai/fraud/fraud-config";
