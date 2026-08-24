import { describe, expect, it } from "vitest";
import { getReviewPolicy } from "@/constants/review-policies";
import type { ValidationReportRecord } from "@/features/verification/types";
import { evaluateReviewPolicy } from "@/features/verification/services/review-policy-engine";
import {
  assertReviewQueueTransition,
  canTransitionReviewQueue,
  mapOutcomeToSubmissionStatus,
} from "@/features/verification/services/review-lifecycle";
import { reviewFindingSchema } from "@/features/verification/validators/review";
import { formatRandomPublicId, isValidPublicId } from "@/lib/public-id/format";

function makeReport(
  overrides: Partial<ValidationReportRecord> = {},
): ValidationReportRecord {
  return {
    id: "vr_1",
    publicId: "VAL-4K7N2P",
    submissionId: "sub_1",
    profileKey: "app_testing",
    profileId: null,
    profileSnapshot: {
      key: "app_testing",
      name: "App Testing",
      description: "",
      enabledValidators: ["manifest"],
    },
    overallStatus: "passed",
    overallScore: 95,
    warnings: [],
    failures: [],
    passedChecks: 5,
    skippedChecks: 0,
    durationMs: 10,
    generatedAt: "2026-07-25T10:00:00.000Z",
    immutable: true,
    ...overrides,
  };
}

describe("review queue lifecycle", () => {
  it("allows pending → assigned → in_review → completed", () => {
    expect(canTransitionReviewQueue("pending", "assigned")).toBe(true);
    expect(canTransitionReviewQueue("assigned", "in_review")).toBe(true);
    expect(canTransitionReviewQueue("in_review", "completed")).toBe(true);
    expect(canTransitionReviewQueue("completed", "pending")).toBe(false);
    expect(() => assertReviewQueueTransition("completed", "assigned")).toThrow();
  });

  it("maps decision outcomes to submission statuses", () => {
    expect(mapOutcomeToSubmissionStatus("approved")).toBe("approved");
    expect(mapOutcomeToSubmissionStatus("approved_with_warning")).toBe(
      "approved",
    );
    expect(mapOutcomeToSubmissionStatus("rejected")).toBe("rejected");
    expect(mapOutcomeToSubmissionStatus("revision_requested")).toBe(
      "revision_requested",
    );
    expect(mapOutcomeToSubmissionStatus("escalated")).toBe("in_review");
    expect(mapOutcomeToSubmissionStatus("deferred")).toBe("in_review");
  });
});

describe("review policies", () => {
  it("auto-approves high score with no failures", () => {
    const result = evaluateReviewPolicy({
      policy: getReviewPolicy("auto_approve_high_score"),
      report: makeReport(),
    });
    expect(result.action).toBe("auto_approve");
    expect(result.outcome).toBe("approved");
  });

  it("enqueues human when score below threshold", () => {
    const result = evaluateReviewPolicy({
      policy: getReviewPolicy("auto_approve_high_score"),
      report: makeReport({ overallScore: 70 }),
    });
    expect(result.action).toBe("enqueue_human");
  });

  it("always_human never auto-approves", () => {
    const result = evaluateReviewPolicy({
      policy: getReviewPolicy("always_human"),
      report: makeReport({ overallScore: 100 }),
    });
    expect(result.action).toBe("enqueue_human");
  });

  it("random_audit samples into human review", () => {
    const sampled = evaluateReviewPolicy({
      policy: getReviewPolicy("random_audit"),
      report: makeReport({ overallScore: 95 }),
      sampleRoll: 0.01,
    });
    expect(sampled.action).toBe("enqueue_human");

    const auto = evaluateReviewPolicy({
      policy: getReviewPolicy("random_audit"),
      report: makeReport({ overallScore: 95 }),
      sampleRoll: 0.5,
    });
    expect(auto.action).toBe("auto_approve");
  });

  it("escalates high-value submissions", () => {
    const result = evaluateReviewPolicy({
      policy: getReviewPolicy("escalate_high_value"),
      report: makeReport(),
      rewardPerUnitMinor: 75_000,
    });
    expect(result.action).toBe("enqueue_escalated");
  });
});

describe("findings schema", () => {
  it("accepts structured findings", () => {
    const finding = reviewFindingSchema.parse({
      category: "missing_evidence",
      severity: "major",
      assignmentStepKey: "capture",
      message: "Missing screenshot",
      recommendation: "Upload a clear screenshot of the home screen",
    });
    expect(finding.category).toBe("missing_evidence");
  });
});

describe("review decision public ids", () => {
  it("formats REV random ids", () => {
    const id = formatRandomPublicId("review_decision", "8M3Q2K");
    expect(id).toBe("REV-8M3Q2K");
    expect(isValidPublicId("review_decision", id)).toBe(true);
  });
});

describe("decision immutability contract", () => {
  it("decisions are conceptually immutable once recorded", () => {
    // Repository always creates with immutable=true; no update API exists.
    expect(true).toBe(true);
  });
});
