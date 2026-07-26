import { describe, expect, it } from "vitest";
import {
  assertSubmissionTransition,
  canTransitionSubmission,
  isEvidenceMutable,
  isSubmissionImmutable,
} from "@/features/submissions/services/lifecycle";
import {
  countEvidenceByKind,
  generateSubmissionSummary,
} from "@/features/submissions/services/summary-engine";
import { hashText } from "@/features/submissions/services/evidence-hash";
import { memoryEvidenceStorageAdapter } from "@/lib/integrations/evidence/memory-adapter";
import { isValidPublicId, formatRandomPublicId } from "@/lib/public-id/format";
import { evidenceReferenceSchema } from "@/features/submissions/validators";

describe("submission lifecycle", () => {
  it("allows draft → ready → submitted → validating", () => {
    expect(canTransitionSubmission("draft", "ready")).toBe(true);
    expect(canTransitionSubmission("ready", "submitted")).toBe(true);
    expect(canTransitionSubmission("submitted", "validating")).toBe(true);
    expect(canTransitionSubmission("submitted", "draft")).toBe(false);
    expect(() => assertSubmissionTransition("closed", "draft")).toThrow();
  });

  it("locks evidence after submit", () => {
    expect(isEvidenceMutable("draft")).toBe(true);
    expect(isEvidenceMutable("ready")).toBe(true);
    expect(isEvidenceMutable("submitted")).toBe(false);
    expect(isSubmissionImmutable("submitted")).toBe(true);
  });
});

describe("evidence manifest helpers", () => {
  it("counts evidence by kind", () => {
    expect(
      countEvidenceByKind(["image", "image", "gps", "text"]),
    ).toEqual({ image: 2, gps: 1, text: 1 });
  });

  it("stores via evidence adapter reference (not vendor URL)", async () => {
    const ref = await memoryEvidenceStorageAdapter.store({
      container: "evidence",
      objectKey: "test/obj",
      body: new TextEncoder().encode("hello"),
      contentType: "text/plain",
    });
    expect(ref.adapter).toBe("memory");
    expect(ref.container).toBe("evidence");
    expect(ref.objectKey).toBe("test/obj");
    const parsed = evidenceReferenceSchema.parse(ref);
    expect(parsed.adapter).toBe("memory");
    const url = await memoryEvidenceStorageAdapter.resolveUrl(ref);
    expect(url.startsWith("memory://")).toBe(true);
  });
});

describe("submission summary", () => {
  it("generates timing and evidence metrics", () => {
    const summary = generateSubmissionSummary({
      startedAt: "2026-07-25T10:00:00.000Z",
      submittedAt: "2026-07-25T10:05:00.000Z",
      completedSteps: 4,
      requiredSteps: 3,
      requiredCompleted: 3,
      progressPercent: 100,
      evidenceKinds: ["image", "image", "text"],
      workerNotes: ["Looks good", "Done"],
      executionContextKeys: ["taskTemplateVersion", "rewardSnapshot"],
    });
    expect(summary.timeSpentSeconds).toBe(300);
    expect(summary.evidenceCounts).toEqual({ image: 2, text: 1 });
    expect(summary.workerNotesSummary).toContain("Looks good");
    expect(summary.executionMetrics.progressPercent).toBe(100);
  });
});

describe("immutability hashing", () => {
  it("hashes text content stably", async () => {
    const a = await hashText("screenshot");
    const b = await hashText("screenshot");
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });
});

describe("submission public ids", () => {
  it("formats SUB random ids", () => {
    const id = formatRandomPublicId("submission", "6P2RM8");
    expect(id).toBe("SUB-6P2RM8");
    expect(isValidPublicId("submission", id)).toBe(true);
  });
});
