import { describe, expect, it } from "vitest";
import {
  isInlineProofKind,
  proofFieldsFromTemplate,
  toManifestEvidenceKind,
} from "@/features/task-marketplace/services/evidence-requirements";

describe("submission proof fields", () => {
  it("uses template required evidence and does not invent extra kinds", () => {
    const fields = proofFieldsFromTemplate({
      requiredEvidence: [
        { kind: "link", required: true, stepKey: "profile" },
        { kind: "image", required: true },
      ],
      capabilitySet: [
        {
          key: "follow",
          capability: "follows_profile",
          instruction: "Follow",
          required: true,
        },
      ],
    });
    expect(fields.map((f) => f.kind)).toEqual(["link", "image"]);
  });

  it("falls back to required capabilities when the template has no evidence list", () => {
    const fields = proofFieldsFromTemplate({
      requiredEvidence: [],
      capabilitySet: [
        {
          key: "note",
          capability: "submits_text",
          instruction: "Write a note",
          required: true,
        },
      ],
    });
    expect(fields.some((f) => f.kind === "text")).toBe(true);
  });

  it("maps location evidence to gps and classifies inline kinds", () => {
    expect(toManifestEvidenceKind("location")).toBe("gps");
    expect(isInlineProofKind("text")).toBe(true);
    expect(isInlineProofKind("image")).toBe(false);
  });
});
