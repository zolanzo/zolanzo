import { describe, expect, it, beforeEach } from "vitest";
import {
  alignEvidenceRequirements,
  composeCapabilitySet,
} from "@/features/task-templates/services/capability-composition";
import {
  canEditTemplate,
  nextVersionNumber,
  requiresNewVersionForEdit,
} from "@/features/task-templates/services/versioning";
import {
  hydrateRegistry,
  getLatestPublishedTemplate,
  resetTemplateRegistry,
} from "@/features/task-templates/services/registry";
import { validateRewardStrategy } from "@/constants/reward-strategies";
import { validateConstraintDefinitions } from "@/constants/constraints";
import { isValidPublicId } from "@/lib/public-id/format";
import { formatSequentialPublicId } from "@/lib/public-id/format";
import type { TaskTemplateRecord } from "@/features/task-templates/types";

describe("capability composition", () => {
  it("composes valid steps", () => {
    const result = composeCapabilitySet([
      {
        key: "download",
        capability: "downloads_app",
        instruction: "Download",
        required: true,
      },
      {
        key: "open",
        capability: "opens_app",
        instruction: "Open",
        required: true,
      },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.capabilities).toContain("downloads_app");
      expect(result.inferredEvidence.length).toBeGreaterThan(0);
    }
  });

  it("rejects duplicate step keys", () => {
    const result = composeCapabilitySet([
      {
        key: "a",
        capability: "submits_text",
        instruction: "One",
        required: true,
      },
      {
        key: "a",
        capability: "submits_text",
        instruction: "Two",
        required: true,
      },
    ]);
    expect(result.ok).toBe(false);
  });

  it("aligns evidence to capabilities", () => {
    const steps = [
      {
        key: "gps",
        capability: "captures_gps" as const,
        instruction: "GPS",
        required: true,
      },
    ];
    expect(
      alignEvidenceRequirements(steps, [
        { kind: "location", required: true },
      ]).ok,
    ).toBe(true);
    expect(
      alignEvidenceRequirements(steps, [{ kind: "video", required: true }]).ok,
    ).toBe(false);
  });
});

describe("versioning", () => {
  it("locks published templates", () => {
    expect(canEditTemplate("draft")).toBe(true);
    expect(canEditTemplate("published")).toBe(false);
    expect(requiresNewVersionForEdit("published")).toBe(true);
    expect(nextVersionNumber(3)).toBe(4);
  });
});

describe("registry", () => {
  beforeEach(() => resetTemplateRegistry());

  it("tracks latest published by key", () => {
    const base = {
      templateKey: "demo",
      name: "Demo",
      slug: "demo",
      description: "d",
      category: "c",
      subcategory: null,
      difficulty: "easy" as const,
      estimatedDurationMin: 10,
      capabilitySet: [],
      requiredEvidence: [],
      submissionSchema: { type: "object" as const, properties: {} },
      validationRules: { mode: "manual" as const, ruleKeys: [] },
      reviewRules: {
        required: true,
        actions: ["approval" as const],
      },
      rewardStrategy: {
        kind: "fixed" as const,
        amountMinor: 1,
        currency: "NGN",
      },
      constraints: [],
      supportedPlatforms: [],
      supportedDevices: [],
      supportedCountries: [],
      supportedLanguages: [],
      requiredSkills: [],
      visibility: "platform" as const,
      metadata: null,
      createdByUserId: null,
      updatedByUserId: null,
      publishedAt: null,
      archivedAt: null,
      previousVersionId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const v1: TaskTemplateRecord = {
      ...base,
      id: "1",
      publicId: "TPL-000001",
      version: 1,
      status: "published",
    };
    const v2: TaskTemplateRecord = {
      ...base,
      id: "2",
      publicId: "TPL-000002",
      version: 2,
      status: "published",
    };

    hydrateRegistry([v1, v2]);
    expect(getLatestPublishedTemplate("demo")?.version).toBe(2);
  });
});

describe("reward + constraints + public ids", () => {
  it("validates rewards", () => {
    expect(
      validateRewardStrategy({
        kind: "fixed",
        amountMinor: 100,
        currency: "NGN",
      }).ok,
    ).toBe(true);
    expect(
      validateRewardStrategy({
        kind: "tiered",
        currency: "NGN",
        tiers: [],
      }).ok,
    ).toBe(false);
  });

  it("validates constraints", () => {
    expect(
      validateConstraintDefinitions([
        {
          id: "c1",
          kind: "device",
          op: "platform_in",
          params: { platforms: ["android"] },
          enforcement: "hard",
        },
      ]).ok,
    ).toBe(true);
  });

  it("formats template public ids", () => {
    const id = formatSequentialPublicId("task_template", 127);
    expect(id).toBe("TPL-000127");
    expect(isValidPublicId("task_template", id)).toBe(true);
  });
});
