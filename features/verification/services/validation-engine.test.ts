import { describe, expect, it } from "vitest";
import { getValidationProfile } from "@/constants/validation-profiles";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";
import type {
  EvidenceManifestRecord,
  SubmissionRecord,
  SubmissionSummaryRecord,
} from "@/features/submissions/types";
import { aggregateValidatorResults } from "@/features/verification/services/aggregation";
import { captureEvidenceSnapshot } from "@/features/verification/services/evidence-snapshot";
import { runValidationPipeline } from "@/features/verification/services/pipeline";
import { getValidator } from "@/features/verification/services/validators";
import type {
  EvidenceSnapshotItem,
  ValidationContext,
  ValidatorResult,
} from "@/features/verification/types";
import { formatRandomPublicId, isValidPublicId } from "@/lib/public-id/format";

function baseExecutionContext(
  overrides: Partial<ExecutionContext> = {},
): ExecutionContext {
  return {
    taskTemplateId: "tpl_1",
    taskTemplateVersion: 1,
    taskTemplatePublicId: "TPL-000001",
    campaignId: "cmp_1",
    campaignPublicId: "CMP-2026-000001",
    campaignRevisionAt: "2026-07-25T00:00:00.000Z",
    workerUserId: "usr_1",
    workerTrustScore: 80,
    eligibility: {
      eligible: true,
      hardFailureIds: [],
      softWarningIds: [],
    },
    claimPolicy: {
      allowed: true,
      errors: [],
      deferred: [],
      rulesApplied: [],
    },
    device: { platforms: ["ios"], devices: ["phone"] },
    countryCode: "NG",
    languages: ["en"],
    activeOrganizationId: null,
    rewardSnapshot: {
      rewardPerUnitMinor: 500,
      currency: "NGN",
      strategyOverride: null,
    },
    capturedAt: "2026-07-25T10:00:00.000Z",
    ...overrides,
  };
}

function makeSubmission(
  overrides: Partial<SubmissionRecord> = {},
): SubmissionRecord {
  return {
    id: "sub_1",
    publicId: "SUB-ABC234",
    assignmentId: "asn_1",
    workerUserId: "usr_1",
    status: "submitted",
    executionContextSnapshot: baseExecutionContext(),
    deviceSnapshot: null,
    gpsSnapshot: null,
    timingMetrics: { timeSpentSeconds: 120 },
    readyAt: "2026-07-25T10:04:00.000Z",
    submittedAt: "2026-07-25T10:05:00.000Z",
    finalizedAt: "2026-07-25T10:05:00.000Z",
    closedAt: null,
    metadata: null,
    createdAt: "2026-07-25T10:00:00.000Z",
    updatedAt: "2026-07-25T10:05:00.000Z",
    ...overrides,
  };
}

function makeManifest(): EvidenceManifestRecord {
  return {
    id: "man_1",
    submissionId: "sub_1",
    version: 1,
    finalized: true,
    finalizedAt: "2026-07-25T10:05:00.000Z",
    createdAt: "2026-07-25T10:00:00.000Z",
    updatedAt: "2026-07-25T10:05:00.000Z",
  };
}

function makeSummary(
  overrides: Partial<SubmissionSummaryRecord> = {},
): SubmissionSummaryRecord {
  return {
    id: "sum_1",
    submissionId: "sub_1",
    timeSpentSeconds: 120,
    completedSteps: 3,
    requiredSteps: 3,
    requiredCompleted: 3,
    evidenceCounts: { image: 1, text: 1 },
    executionMetrics: { progressPercent: 100 },
    workerNotesSummary: "Done",
    generatedAt: "2026-07-25T10:05:00.000Z",
    ...overrides,
  };
}

function makeEvidence(
  overrides: Partial<EvidenceSnapshotItem> = {},
): EvidenceSnapshotItem {
  return {
    evidenceItemId: "ev_1",
    kind: "image",
    label: "Screenshot 1",
    stepKey: "capture",
    reference: {
      adapter: "memory",
      container: "evidence",
      objectKey: "sub_1/shot1",
      contentType: "image/png",
    },
    contentHash: "abc123",
    sizeBytes: 1024,
    inlinePayload: null,
    metadata: null,
    createdAt: "2026-07-25T10:02:00.000Z",
    ...overrides,
  };
}

function makeCtx(
  overrides: Partial<ValidationContext> = {},
): ValidationContext {
  const profile = getValidationProfile("app_testing");
  return {
    submission: makeSubmission(),
    manifest: makeManifest(),
    summary: makeSummary(),
    evidenceSnapshot: [
      makeEvidence(),
      makeEvidence({
        evidenceItemId: "ev_2",
        kind: "text",
        label: "Notes",
        reference: {
          adapter: "memory",
          container: "inline",
          objectKey: "text/notes",
        },
        contentHash: null,
        sizeBytes: null,
        inlinePayload: "Looks good",
      }),
    ],
    executionContext: baseExecutionContext(),
    profile,
    ...overrides,
  };
}

describe("validation pipeline", () => {
  it("runs enabled validators and aggregates pass", async () => {
    const profile = getValidationProfile("survey");
    const aggregated = await runValidationPipeline(
      makeCtx({
        profile,
        evidenceSnapshot: [
          makeEvidence({
            evidenceItemId: "ev_t",
            kind: "text",
            label: "Answer",
            inlinePayload: "Yes",
            contentHash: null,
            reference: {
              adapter: "memory",
              container: "inline",
              objectKey: "t1",
            },
          }),
        ],
      }),
      profile,
    );
    expect(aggregated.overallStatus).toBe("passed");
    expect(aggregated.failures).toHaveLength(0);
    expect(aggregated.passedChecks).toBeGreaterThan(0);
    expect(aggregated.results.length).toBe(profile.enabledValidators.length);
  });

  it("fails when required steps incomplete", async () => {
    const result = await getValidator("step_completion").validate(
      makeCtx({
        summary: makeSummary({
          requiredSteps: 3,
          requiredCompleted: 1,
          completedSteps: 1,
        }),
      }),
    );
    expect(result.status).toBe("fail");
  });

  it("isolates file reference failures", async () => {
    const result = await getValidator("file_reference").validate(
      makeCtx({
        evidenceSnapshot: [
          makeEvidence({
            reference: {
              adapter: "memory",
              container: "",
              objectKey: "x",
            },
          }),
        ],
      }),
    );
    expect(result.status).toBe("fail");
    expect(result.messages.some((m) => m.includes("container"))).toBe(true);
  });
});

describe("profile selection", () => {
  it("enables different validators per profile", () => {
    const survey = getValidationProfile("survey");
    const property = getValidationProfile("property_verification");
    expect(survey.enabledValidators.includes("gps")).toBe(false);
    expect(property.enabledValidators.includes("gps")).toBe(true);
    expect(property.ruleKeys).toContain("require_gps");
  });
});

describe("aggregation", () => {
  it("marks passed_with_warnings when only warnings", () => {
    const results: ValidatorResult[] = [
      {
        validatorName: "manifest",
        status: "pass",
        score: 100,
        durationMs: 1,
        messages: [],
        metadata: null,
      },
      {
        validatorName: "timing",
        status: "warning",
        score: 50,
        durationMs: 1,
        messages: ["slow"],
        metadata: null,
      },
    ];
    const agg = aggregateValidatorResults(results, 10);
    expect(agg.overallStatus).toBe("passed_with_warnings");
    expect(agg.warnings[0]).toContain("timing");
  });

  it("marks failed when any fail", () => {
    const agg = aggregateValidatorResults(
      [
        {
          validatorName: "rule",
          status: "fail",
          score: 0,
          durationMs: 1,
          messages: ["missing image"],
          metadata: null,
        },
      ],
      5,
    );
    expect(agg.overallStatus).toBe("failed");
    expect(agg.failures).toHaveLength(1);
  });
});

describe("evidence snapshot", () => {
  it("freezes evidence item fields", () => {
    const snapshot = captureEvidenceSnapshot([
      {
        id: "ev_1",
        manifestId: "man_1",
        kind: "image",
        label: "Shot",
        stepKey: "s1",
        reference: {
          adapter: "memory",
          container: "c",
          objectKey: "k",
        },
        contentHash: "h1",
        sizeBytes: 10,
        inlinePayload: null,
        metadata: { a: 1 },
        createdAt: "2026-07-25T10:00:00.000Z",
        updatedAt: "2026-07-25T10:00:00.000Z",
        replacedAt: null,
      },
    ]);
    expect(snapshot[0]?.evidenceItemId).toBe("ev_1");
    expect(snapshot[0]?.contentHash).toBe("h1");
    expect(snapshot[0]?.reference.adapter).toBe("memory");
    snapshot[0]!.metadata!.a = 2;
    expect(snapshot[0]?.metadata).toEqual({ a: 2 });
  });
});

describe("validation public ids", () => {
  it("formats VAL random ids", () => {
    const id = formatRandomPublicId("validation_report", "4K7N2P");
    expect(id).toBe("VAL-4K7N2P");
    expect(isValidPublicId("validation_report", id)).toBe(true);
  });
});
