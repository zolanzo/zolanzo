/**
 * FraudDetector — production advisory risk engine.
 * Never approves, rejects, or mutates business data.
 */

import { collectFraudEvidence } from "@/lib/ai/fraud/evidence-collector";
import { evaluateRuleRisk } from "@/lib/ai/fraud/rule-risk-engine";
import { analyzeAiRisk } from "@/lib/ai/fraud/ai-risk-analyzer";
import { aggregateRisk } from "@/lib/ai/fraud/risk-aggregator";
import { buildFraudExplanation } from "@/lib/ai/fraud/explanation-builder";
import {
  isFraudDetectionEnabled,
  FRAUD_ENGINE_MODEL_VERSION,
} from "@/lib/ai/fraud/fraud-config";
import { recordFraudTelemetry } from "@/lib/ai/fraud/fraud-telemetry";
import type {
  FraudAssessment,
  FraudEvidenceBundle,
} from "@/lib/ai/fraud/fraud-types";
import type {
  FraudDetectionInput,
  FraudDetectionResult,
  FraudDetector,
} from "@/lib/ai/types";

export type AssessFraudInput = {
  bundle: FraudEvidenceBundle;
  forceRuleOnly?: boolean;
};

export async function assessSubmissionFraud(
  input: AssessFraudInput,
): Promise<FraudAssessment> {
  const started = Date.now();

  if (!isFraudDetectionEnabled()) {
    const latencyMs = Date.now() - started;
    recordFraudTelemetry({
      success: true,
      latencyMs,
      riskScore: 0,
      highRisk: false,
      aiAugmented: false,
    });
    return {
      submissionId: input.bundle.submissionId,
      riskScore: 0,
      riskLevel: "low",
      confidence: 0,
      reasons: ["Fraud detection disabled"],
      reasonDetails: [],
      warnings: ["Engine disabled — no risk assessment performed"],
      suggestedActions: ["review_evidence"],
      ruleScore: 0,
      aiAugmented: false,
      fallbackUsed: true,
      advisoryOnly: true,
      modelVersion: FRAUD_ENGINE_MODEL_VERSION,
      latencyMs,
    };
  }

  try {
    const rules = evaluateRuleRisk(input.bundle);
    const ai = analyzeAiRisk(input.bundle, {
      forceDisabled: input.forceRuleOnly,
    });
    const aggregated = aggregateRisk({
      ruleFindings: rules.findings,
      ruleScore: rules.ruleScore,
      aiFindings: ai.findings,
      aiRan: ai.ran,
      aiConfidence: ai.confidence,
    });

    const latencyMs = Date.now() - started;
    const assessment = buildFraudExplanation({
      submissionId: input.bundle.submissionId,
      riskScore: aggregated.riskScore,
      riskLevel: aggregated.riskLevel,
      confidence: aggregated.confidence,
      findings: aggregated.findings,
      aiAugmented: aggregated.aiAugmented,
      fallbackUsed: aggregated.fallbackUsed,
      latencyMs,
    });

    // Fix ruleScore from pure rule engine (explanation summed deltas before clamp)
    assessment.ruleScore = rules.ruleScore;

    recordFraudTelemetry({
      success: true,
      latencyMs,
      riskScore: assessment.riskScore,
      highRisk:
        assessment.riskLevel === "high" ||
        assessment.riskLevel === "critical",
      aiAugmented: assessment.aiAugmented,
    });

    return assessment;
  } catch (error) {
    const latencyMs = Date.now() - started;
    recordFraudTelemetry({ success: false, latencyMs });
    throw error;
  }
}

/**
 * Adapter for FraudDetector port (4.1A interface).
 */
export const fraudDetector: FraudDetector = {
  async assess(input: FraudDetectionInput): Promise<FraudDetectionResult> {
    const snap = input.knowledgeSnapshot;
    const bundle =
      (snap.bundle as FraudEvidenceBundle | undefined) ??
      collectFraudEvidence({
        submissionId: input.submissionId,
        organizationId: input.organizationId,
        workerUserId: String(snap.workerUserId ?? "unknown"),
        status: String(snap.status ?? "submitted"),
        requiredEvidenceKinds: Array.isArray(snap.requiredEvidenceKinds)
          ? (snap.requiredEvidenceKinds as string[])
          : [],
        evidenceItems: Array.isArray(snap.evidenceItems)
          ? (snap.evidenceItems as FraudEvidenceBundle["evidenceItems"])
          : [],
        gpsRaw: (snap.gps as Record<string, unknown>) ?? null,
        deviceRaw: (snap.device as Record<string, unknown>) ?? null,
        duplicateHashMatches: Number(snap.duplicateHashMatches ?? 0),
        sharedDeviceAccountCount: Number(snap.sharedDeviceAccountCount ?? 0),
        historicalRejectionRate: Number(snap.historicalRejectionRate ?? 0),
        campaignCountryScope: Array.isArray(snap.campaignCountryScope)
          ? (snap.campaignCountryScope as string[])
          : [],
        campaignCenter: (snap.campaignCenter as {
          lat: number;
          lng: number;
        } | null) ?? null,
        campaignRadiusKm:
          snap.campaignRadiusKm != null
            ? Number(snap.campaignRadiusKm)
            : null,
        workerCountryCode: (snap.workerCountryCode as string | null) ?? null,
        emailVerified: Boolean(snap.emailVerified),
        phoneVerified: Boolean(snap.phoneVerified),
        timing: {
          timeSpentSeconds:
            snap.timeSpentSeconds != null
              ? Number(snap.timeSpentSeconds)
              : null,
          submittedAt: (snap.submittedAt as string | null) ?? null,
        },
        narrativeText: (snap.narrativeText as string | null) ?? null,
        recentSubmissionBurst: Number(snap.recentSubmissionBurst ?? 0),
        priorFraudIndicators: Number(snap.priorFraudIndicators ?? 0),
      });

    const assessment = await assessSubmissionFraud({ bundle });

    return {
      riskScore: assessment.riskScore,
      findings: assessment.reasonDetails.map((f) => ({
        code: f.code,
        severity: f.severity,
        message: f.label,
      })),
      advisoryOnly: true,
      riskLevel: assessment.riskLevel,
      confidence: assessment.confidence,
      reasons: assessment.reasons,
      warnings: assessment.warnings,
      suggestedActions: assessment.suggestedActions,
    };
  },
};

/** @deprecated Use fraudDetector */
export const fraudDetectorStub = fraudDetector;
