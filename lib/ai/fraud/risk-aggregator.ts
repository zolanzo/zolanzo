/**
 * RiskAggregator — merge rule + AI findings into a single score.
 * AI never replaces the rule baseline; it adds bounded enrichment.
 */

import type {
  FraudRiskFinding,
  FraudRiskLevel,
} from "@/lib/ai/fraud/fraud-types";

export function riskLevelFromScore(score: number): FraudRiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export type AggregateRiskInput = {
  ruleFindings: FraudRiskFinding[];
  ruleScore: number;
  aiFindings: FraudRiskFinding[];
  aiRan: boolean;
  aiConfidence: number;
};

export type AggregateRiskResult = {
  riskScore: number;
  riskLevel: FraudRiskLevel;
  confidence: number;
  findings: FraudRiskFinding[];
  aiAugmented: boolean;
  fallbackUsed: boolean;
};

/**
 * Final score = clamp(ruleScore + min(20, sum(ai deltas))).
 * When AI did not run: score = ruleScore, confidence from rule strength.
 */
export function aggregateRisk(
  input: AggregateRiskInput,
): AggregateRiskResult {
  const aiDelta = Math.min(
    20,
    input.aiFindings.reduce((s, f) => s + f.delta, 0),
  );
  const aiAugmented = input.aiRan && input.aiFindings.length > 0;
  const riskScore = Math.max(
    0,
    Math.min(100, Math.round(input.ruleScore + (aiAugmented ? aiDelta : 0))),
  );

  const ruleConfidence = Math.min(
    0.95,
    0.5 + input.ruleFindings.length * 0.05,
  );
  const confidence = input.aiRan
    ? Math.min(0.99, (ruleConfidence + input.aiConfidence) / 2)
    : ruleConfidence;

  return {
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
    confidence: Math.round(confidence * 100) / 100,
    findings: [...input.ruleFindings, ...input.aiFindings],
    aiAugmented,
    fallbackUsed: !input.aiRan,
  };
}
