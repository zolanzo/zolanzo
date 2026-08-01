/**
 * Phase 4.1C — AI Fraud Detection tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectFraudEvidence } from "@/lib/ai/fraud/evidence-collector";
import { evaluateRuleRisk, haversineKm } from "@/lib/ai/fraud/rule-risk-engine";
import { analyzeAiRisk } from "@/lib/ai/fraud/ai-risk-analyzer";
import { aggregateRisk, riskLevelFromScore } from "@/lib/ai/fraud/risk-aggregator";
import { buildFraudExplanation } from "@/lib/ai/fraud/explanation-builder";
import { assessSubmissionFraud, fraudDetector } from "@/lib/ai/fraud/fraud-detector";
import {
  isFraudDetectionEnabled,
  isDuplicateAnalysisEnabled,
  isGeoAnalysisEnabled,
  isFraudExplainabilityEnabled,
} from "@/lib/ai/fraud/fraud-config";
import {
  getFraudTelemetrySnapshot,
  resetFraudTelemetryForTests,
} from "@/lib/ai/fraud/fraud-telemetry";
import type { FraudEvidenceBundle } from "@/lib/ai/fraud/fraud-types";

const ORIGINAL_ENV = { ...process.env };

function baseBundle(
  overrides: Partial<FraudEvidenceBundle> = {},
): FraudEvidenceBundle {
  return {
    ...collectFraudEvidence({
      submissionId: "sub_1",
      submissionPublicId: "SUB-1",
      organizationId: "org_1",
      campaignId: "cmp_1",
      workerUserId: "worker_1",
      status: "submitted",
      requiredEvidenceKinds: ["image", "gps"],
      evidenceItems: [
        {
          id: "e1",
          kind: "image",
          label: "Storefront",
          contentHash: "hash-a",
          sizeBytes: 120_000,
          replacedAt: null,
        },
        {
          id: "e2",
          kind: "gps",
          label: "Location",
          contentHash: null,
          sizeBytes: null,
          replacedAt: null,
        },
      ],
      gpsRaw: { lat: 12.0, lng: 8.5, accuracy: 10 },
      deviceRaw: { fingerprint: "dev-1", platform: "android" },
      timing: {
        timeSpentSeconds: 600,
        submittedAt: "2026-07-26T12:00:00.000Z",
        createdAt: "2026-07-26T11:50:00.000Z",
      },
      campaignCountryScope: ["NG"],
      campaignCenter: { lat: 12.0, lng: 8.5 },
      campaignRadiusKm: 25,
      workerCountryCode: "NG",
      emailVerified: true,
      phoneVerified: true,
      historicalRejectionRate: 0.1,
      priorFraudIndicators: 0,
      duplicateHashMatches: 0,
      sharedDeviceAccountCount: 0,
      recentSubmissionBurst: 0,
      narrativeText: "Completed field visit at the assigned store location.",
    }),
    ...overrides,
  };
}

beforeEach(() => {
  resetFraudTelemetryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AI_FRAUD_DETECTION;
  delete process.env.AI_FRAUD_EXPLAINABILITY;
  delete process.env.AI_DUPLICATE_ANALYSIS;
  delete process.env.AI_GEO_ANALYSIS;
  delete process.env.AI_ENABLED;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults fraud detection capabilities on", () => {
    expect(isFraudDetectionEnabled()).toBe(true);
    expect(isFraudExplainabilityEnabled()).toBe(true);
    expect(isDuplicateAnalysisEnabled()).toBe(true);
    expect(isGeoAnalysisEnabled()).toBe(true);
  });

  it("respects AI_FRAUD_DETECTION=0", () => {
    process.env.AI_FRAUD_DETECTION = "0";
    expect(isFraudDetectionEnabled()).toBe(false);
  });
});

describe("RuleRiskEngine", () => {
  it("scores a clean submission low", () => {
    const result = evaluateRuleRisk(baseBundle());
    expect(result.ruleScore).toBeLessThan(35);
    expect(riskLevelFromScore(result.ruleScore)).toBe("low");
  });

  it("flags duplicate evidence across submissions", () => {
    const result = evaluateRuleRisk(
      baseBundle({ duplicateHashMatches: 2 }),
    );
    expect(
      result.findings.some((f) => f.code === "duplicate_across_submissions"),
    ).toBe(true);
    expect(result.ruleScore).toBeGreaterThanOrEqual(14);
  });

  it("flags duplicate within submission", () => {
    const bundle = baseBundle({
      evidenceItems: [
        {
          id: "e1",
          kind: "image",
          label: "a",
          contentHash: "same",
          sizeBytes: 10,
          replacedAt: null,
        },
        {
          id: "e2",
          kind: "image",
          label: "b",
          contentHash: "same",
          sizeBytes: 10,
          replacedAt: null,
        },
        {
          id: "e3",
          kind: "gps",
          label: "g",
          contentHash: null,
          sizeBytes: null,
          replacedAt: null,
        },
      ],
    });
    const result = evaluateRuleRisk(bundle);
    expect(
      result.findings.some((f) => f.code === "duplicate_within_submission"),
    ).toBe(true);
  });

  it("flags GPS outside campaign boundary", () => {
    const result = evaluateRuleRisk(
      baseBundle({
        gps: { lat: 6.5, lng: 3.4, accuracyM: 5, capturedAt: null },
        campaignCenter: { lat: 12.0, lng: 8.5 },
        campaignRadiusKm: 10,
      }),
    );
    expect(
      result.findings.some((f) => f.code === "gps_outside_boundary"),
    ).toBe(true);
  });

  it("skips geo when AI_GEO_ANALYSIS=0", () => {
    process.env.AI_GEO_ANALYSIS = "0";
    const result = evaluateRuleRisk(
      baseBundle({
        gps: { lat: 6.5, lng: 3.4, accuracyM: 5, capturedAt: null },
        campaignCenter: { lat: 12.0, lng: 8.5 },
        campaignRadiusKm: 10,
      }),
    );
    expect(
      result.findings.some((f) => f.code === "gps_outside_boundary"),
    ).toBe(false);
  });

  it("flags shared device across accounts", () => {
    const result = evaluateRuleRisk(
      baseBundle({ sharedDeviceAccountCount: 3 }),
    );
    expect(result.findings.some((f) => f.code === "shared_device")).toBe(
      true,
    );
  });

  it("flags impossible travel", () => {
    const result = evaluateRuleRisk(
      baseBundle({
        previousGps: {
          lat: 40.7,
          lng: -74.0,
          accuracyM: 10,
          capturedAt: null,
        },
        previousSubmittedAt: "2026-07-26T11:50:00.000Z",
        timing: {
          timeSpentSeconds: 600,
          submittedAt: "2026-07-26T12:00:00.000Z",
          readyAt: null,
          createdAt: "2026-07-26T11:50:00.000Z",
        },
      }),
    );
    expect(result.findings.some((f) => f.code === "impossible_travel")).toBe(
      true,
    );
  });
});

describe("haversine", () => {
  it("computes roughly correct distance", () => {
    const km = haversineKm(
      { lat: 12.0, lng: 8.5 },
      { lat: 12.1, lng: 8.5 },
    );
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(20);
  });
});

describe("aggregation + explainability", () => {
  it("aggregates rule + AI with bounded boost", () => {
    const rules = evaluateRuleRisk(
      baseBundle({ duplicateHashMatches: 2, sharedDeviceAccountCount: 2 }),
    );
    const ai = {
      findings: [
        {
          code: "ai_duplicate_pattern",
          label: "Duplicate patterns",
          delta: 8,
          severity: "high" as const,
          source: "ai" as const,
        },
      ],
      confidence: 0.91,
      ran: true,
    };
    const agg = aggregateRisk({
      ruleFindings: rules.findings,
      ruleScore: rules.ruleScore,
      aiFindings: ai.findings,
      aiRan: true,
      aiConfidence: 0.91,
    });
    expect(agg.aiAugmented).toBe(true);
    expect(agg.riskScore).toBe(Math.min(100, rules.ruleScore + 8));
    expect(agg.riskLevel).toBe(riskLevelFromScore(agg.riskScore));
  });

  it("falls back to rule-only when AI did not run", () => {
    const rules = evaluateRuleRisk(baseBundle());
    const agg = aggregateRisk({
      ruleFindings: rules.findings,
      ruleScore: rules.ruleScore,
      aiFindings: [],
      aiRan: false,
      aiConfidence: 0,
    });
    expect(agg.riskScore).toBe(rules.ruleScore);
    expect(agg.fallbackUsed).toBe(true);
    expect(agg.aiAugmented).toBe(false);
  });

  it("builds reviewer-facing explanation", () => {
    const explanation = buildFraudExplanation({
      submissionId: "sub_1",
      riskScore: 82,
      riskLevel: "high",
      confidence: 0.91,
      findings: [
        {
          code: "duplicate_across_submissions",
          label: "Duplicate image detected",
          delta: 22,
          severity: "high",
          source: "rule",
        },
        {
          code: "gps_outside_boundary",
          label: "GPS outside campaign area",
          delta: 18,
          severity: "high",
          source: "rule",
        },
        {
          code: "shared_device",
          label: "Same device seen across multiple accounts",
          delta: 16,
          severity: "high",
          source: "rule",
        },
      ],
      aiAugmented: false,
      fallbackUsed: true,
      latencyMs: 12,
    });
    expect(explanation.advisoryOnly).toBe(true);
    expect(explanation.reasons.some((r) => /Duplicate/i.test(r))).toBe(true);
    expect(explanation.warnings).toContain("Manual review recommended");
    expect(explanation.suggestedActions).toContain("review_evidence");
    expect(explanation.suggestedActions).toContain("escalate");
  });
});

describe("AIRiskAnalyzer", () => {
  it("does not run when AI_ENABLED off", () => {
    const result = analyzeAiRisk(baseBundle({ duplicateHashMatches: 3 }));
    expect(result.ran).toBe(false);
    expect(result.findings).toEqual([]);
  });

  it("enriches when AI_ENABLED on", () => {
    process.env.AI_ENABLED = "1";
    const result = analyzeAiRisk(
      baseBundle({
        duplicateHashMatches: 3,
        narrativeText: "ok",
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "x",
            contentHash: "h",
            sizeBytes: 500,
            replacedAt: null,
          },
          {
            id: "e2",
            kind: "gps",
            label: "g",
            contentHash: null,
            sizeBytes: null,
            replacedAt: null,
          },
        ],
      }),
    );
    expect(result.ran).toBe(true);
    expect(result.findings.length).toBeGreaterThan(0);
  });
});

describe("FraudAssessmentService pipeline", () => {
  it("returns high risk for stacked signals", async () => {
    const assessment = await assessSubmissionFraud({
      bundle: baseBundle({
        duplicateHashMatches: 2,
        sharedDeviceAccountCount: 3,
        gps: { lat: 6.4, lng: 3.4, accuracyM: 5, capturedAt: null },
        campaignCenter: { lat: 12.0, lng: 8.5 },
        campaignRadiusKm: 5,
        emailVerified: false,
        phoneVerified: false,
        historicalRejectionRate: 0.55,
        timing: {
          timeSpentSeconds: 10,
          submittedAt: "2026-07-26T12:00:00.000Z",
          readyAt: null,
          createdAt: "2026-07-26T11:59:50.000Z",
        },
      }),
      forceRuleOnly: true,
    });
    expect(assessment.advisoryOnly).toBe(true);
    expect(assessment.riskScore).toBeGreaterThanOrEqual(65);
    expect(["high", "critical"]).toContain(assessment.riskLevel);
    expect(assessment.reasons.length).toBeGreaterThan(0);
    expect(getFraudTelemetrySnapshot().assessments).toBe(1);
  });

  it("returns empty-ish when engine disabled", async () => {
    process.env.AI_FRAUD_DETECTION = "false";
    const assessment = await assessSubmissionFraud({
      bundle: baseBundle({ duplicateHashMatches: 5 }),
      forceRuleOnly: true,
    });
    expect(assessment.riskScore).toBe(0);
    expect(assessment.fallbackUsed).toBe(true);
  });

  it("FraudDetector port assesses from knowledge snapshot", async () => {
    const result = await fraudDetector.assess({
      submissionId: "sub_x",
      organizationId: "org_1",
      knowledgeSnapshot: {
        workerUserId: "w1",
        emailVerified: true,
        phoneVerified: true,
        duplicateHashMatches: 1,
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "a",
            contentHash: "h1",
            sizeBytes: 10_000,
            replacedAt: null,
          },
        ],
        requiredEvidenceKinds: ["image"],
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.findings.some((f) => f.code.includes("duplicate"))).toBe(
      true,
    );
  });
});
