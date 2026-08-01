/**
 * AIRiskAnalyzer — optional enrichment. Never replaces rule findings.
 * Uses deterministic heuristics (no live LLM required); gated by AI_ENABLED.
 */

import { shouldRunAiRiskAnalyzer } from "@/lib/ai/fraud/fraud-config";
import type {
  FraudEvidenceBundle,
  FraudRiskFinding,
} from "@/lib/ai/fraud/fraud-types";

export type AiRiskResult = {
  findings: FraudRiskFinding[];
  /** 0–1 confidence in AI enrichment */
  confidence: number;
  ran: boolean;
};

/**
 * Heuristic AI-style signals: duplicate patterns, narrative quirks,
 * cross-submission similarity proxies, image quality proxies, behavior anomalies.
 */
export function analyzeAiRisk(
  bundle: FraudEvidenceBundle,
  options?: { forceDisabled?: boolean },
): AiRiskResult {
  const enabled =
    !options?.forceDisabled && shouldRunAiRiskAnalyzer();
  if (!enabled) {
    return { findings: [], confidence: 0, ran: false };
  }

  const findings: FraudRiskFinding[] = [];

  // Duplicate patterns (soft — complements rule engine)
  if (bundle.duplicateHashMatches >= 2) {
    findings.push({
      code: "ai_duplicate_pattern",
      label: "Duplicate patterns across submissions",
      delta: 8,
      severity: "high",
      source: "ai",
      signal: bundle.duplicateHashMatches,
    });
  }

  // Suspicious narratives — very short / repetitive placeholder text
  if (bundle.narrativeText) {
    const text = bundle.narrativeText.trim();
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 0 && words.length < 4) {
      findings.push({
        code: "ai_suspicious_narrative",
        label: "Suspicious narrative (too short)",
        delta: 6,
        severity: "medium",
        source: "ai",
      });
    }
    const unique = new Set(words.map((w) => w.toLowerCase()));
    if (words.length >= 8 && unique.size / words.length < 0.35) {
      findings.push({
        code: "ai_repetitive_narrative",
        label: "Suspicious narrative (highly repetitive)",
        delta: 7,
        severity: "medium",
        source: "ai",
      });
    }
  }

  // Cross-submission similarity proxy via burst + shared device
  if (
    bundle.recentSubmissionBurst >= 3 &&
    bundle.sharedDeviceAccountCount >= 1
  ) {
    findings.push({
      code: "ai_cross_submission_similarity",
      label: "Cross-submission similarity / coordinated behavior",
      delta: 10,
      severity: "high",
      source: "ai",
    });
  }

  // Image quality proxy — tiny files for photo kinds
  const tinyPhotos = bundle.evidenceItems.filter(
    (i) =>
      !i.replacedAt &&
      i.kind === "image" &&
      i.sizeBytes != null &&
      i.sizeBytes < 8_000,
  );
  if (tinyPhotos.length > 0) {
    findings.push({
      code: "ai_image_quality",
      label: "Image quality indicators (suspiciously small file)",
      delta: Math.min(12, tinyPhotos.length * 5),
      severity: "medium",
      source: "ai",
      signal: tinyPhotos.length,
    });
  }

  // Behavior anomalies — high rejection + unverified
  if (
    bundle.historicalRejectionRate >= 0.5 &&
    !bundle.emailVerified &&
    !bundle.phoneVerified
  ) {
    findings.push({
      code: "ai_behavior_anomaly",
      label: "Behavior anomaly (rejection history + unverified)",
      delta: 9,
      severity: "high",
      source: "ai",
    });
  }

  const confidence = Math.max(
    0.4,
    Math.min(0.95, 0.55 + findings.length * 0.08),
  );

  return { findings, confidence, ran: true };
}
