/**
 * ExplanationBuilder — reviewer-facing fraud assessment narrative.
 */

import { isFraudExplainabilityEnabled } from "@/lib/ai/fraud/fraud-config";
import type {
  FraudAssessment,
  FraudRiskFinding,
  FraudRiskLevel,
  FraudSuggestedAction,
} from "@/lib/ai/fraud/fraud-types";
import { FRAUD_ENGINE_MODEL_VERSION } from "@/lib/ai/fraud/fraud-types";

export function suggestActions(
  findings: FraudRiskFinding[],
  riskLevel: FraudRiskLevel,
): FraudSuggestedAction[] {
  const actions = new Set<FraudSuggestedAction>();
  actions.add("review_evidence");

  for (const f of findings) {
    if (f.code.includes("duplicate")) actions.add("check_duplicates");
    if (f.code.includes("gps") || f.code.includes("travel") || f.code.includes("geo")) {
      actions.add("validate_location");
    }
    if (f.code.includes("identity")) actions.add("verify_identity");
  }

  if (riskLevel === "high" || riskLevel === "critical") {
    actions.add("request_clarification");
    actions.add("escalate");
  } else if (riskLevel === "medium") {
    actions.add("request_clarification");
  }

  return [...actions];
}

export function buildFraudExplanation(params: {
  submissionId: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  confidence: number;
  findings: FraudRiskFinding[];
  aiAugmented: boolean;
  fallbackUsed: boolean;
  latencyMs: number;
  explainability?: boolean;
}): FraudAssessment {
  const explain =
    params.explainability ?? isFraudExplainabilityEnabled();

  const sorted = [...params.findings]
    .filter((f) => f.delta > 0)
    .sort((a, b) => b.delta - a.delta);

  const reasonDetails = explain ? sorted.slice(0, 12) : [];

  const reasons = explain
    ? reasonDetails.map((f) => `+ ${f.label}`)
    : [`Risk score ${params.riskScore}`];

  const warnings: string[] = [];
  if (params.riskLevel === "high" || params.riskLevel === "critical") {
    warnings.push("Manual review recommended");
  }
  if (params.riskLevel === "critical") {
    warnings.push("Escalate if pattern confirmed");
  }
  if (params.fallbackUsed) {
    warnings.push("Rule-only assessment (AI enricher not applied)");
  }

  const suggestedActions = suggestActions(params.findings, params.riskLevel);

  return {
    submissionId: params.submissionId,
    riskScore: params.riskScore,
    riskLevel: params.riskLevel,
    confidence: params.confidence,
    reasons,
    reasonDetails,
    warnings,
    suggestedActions,
    ruleScore: params.findings
      .filter((f) => f.source === "rule")
      .reduce((s, f) => s + f.delta, 0),
    aiAugmented: params.aiAugmented,
    fallbackUsed: params.fallbackUsed,
    advisoryOnly: true,
    modelVersion: FRAUD_ENGINE_MODEL_VERSION,
    latencyMs: params.latencyMs,
  };
}
