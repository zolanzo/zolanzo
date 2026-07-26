import { describe, expect, it } from "vitest";
import { evaluateWorkerEligibility } from "@/features/task-marketplace/services/eligibility-evaluate";
import { evaluateClaimPolicies } from "@/features/task-marketplace/services/claim-policies";
import { opportunityCategoryLabel } from "@/features/task-marketplace/services/opportunity-labels";
import {
  DEFAULT_RESERVATION_TIMEOUT_SECONDS,
  validateClaimPolicyRules,
} from "@/constants/claim-policies";
import { isValidPublicId, formatRandomPublicId } from "@/lib/public-id/format";
import type { TemplateConstraint } from "@/constants/constraints";
import type { WorkerEligibilityContext } from "@/features/task-marketplace/types/worker-context";

const worker: WorkerEligibilityContext = {
  userId: "w1",
  countryCode: "NG",
  languages: ["en"],
  skills: ["qa"],
  platforms: ["android"],
  devices: ["android"],
  trustScore: 75,
  approvalRate: 0.9,
  completedTasks: 20,
  organizationIds: ["org1"],
};

describe("eligibility evaluation", () => {
  it("passes matching country/platform/trust constraints", () => {
    const constraints: TemplateConstraint[] = [
      {
        id: "android_only",
        kind: "device",
        op: "platform_in",
        params: { platforms: ["android"] },
        enforcement: "hard",
      },
      {
        id: "trust",
        kind: "worker",
        op: "min_trust_score",
        params: { min: 60 },
        enforcement: "hard",
      },
    ];
    const result = evaluateWorkerEligibility({
      constraints,
      worker,
      countryScope: ["NG"],
      languageScope: ["en"],
      deviceScope: ["android"],
    });
    expect(result.eligible).toBe(true);
  });

  it("hard-fails country mismatch", () => {
    const result = evaluateWorkerEligibility({
      constraints: [],
      worker,
      countryScope: ["KE"],
    });
    expect(result.eligible).toBe(false);
    expect(result.hardFailures[0]?.constraintId).toBe("campaign.country_scope");
  });

  it("soft-warns without blocking", () => {
    const result = evaluateWorkerEligibility({
      constraints: [
        {
          id: "skill",
          kind: "worker",
          op: "skill_in",
          params: { skills: ["voice"] },
          enforcement: "soft",
        },
      ],
      worker,
    });
    expect(result.eligible).toBe(true);
    expect(result.softWarnings).toHaveLength(1);
  });
});

describe("claim policies", () => {
  it("validates rule shapes", () => {
    expect(
      validateClaimPolicyRules([
        { kind: "first_come_first_served" },
        { kind: "max_concurrent_assignments", max: 10 },
      ]).ok,
    ).toBe(true);
  });

  it("blocks one_active_per_campaign", () => {
    const result = evaluateClaimPolicies({
      rules: [{ kind: "one_active_per_campaign" }],
      worker,
      campaignOrganizationId: "org1",
      stats: {
        activeAssignmentCount: 1,
        activeAssignmentsForCampaign: 1,
        lastCompletedAt: null,
      },
    });
    expect(result.allowed).toBe(false);
  });

  it("enforces max concurrent and cooldown", () => {
    const maxed = evaluateClaimPolicies({
      rules: [{ kind: "max_concurrent_assignments", max: 2 }],
      worker,
      campaignOrganizationId: "org1",
      stats: {
        activeAssignmentCount: 2,
        activeAssignmentsForCampaign: 0,
        lastCompletedAt: null,
      },
    });
    expect(maxed.allowed).toBe(false);

    const cool = evaluateClaimPolicies({
      rules: [{ kind: "cooldown_after_completion", cooldownMinutes: 60 }],
      worker,
      campaignOrganizationId: "org1",
      stats: {
        activeAssignmentCount: 0,
        activeAssignmentsForCampaign: 0,
        lastCompletedAt: new Date().toISOString(),
      },
    });
    expect(cool.allowed).toBe(false);
  });

  it("requires invite token and org membership", () => {
    const invite = evaluateClaimPolicies({
      rules: [{ kind: "invite_only" }],
      worker: { ...worker, inviteToken: null },
      campaignOrganizationId: "org1",
      stats: {
        activeAssignmentCount: 0,
        activeAssignmentsForCampaign: 0,
        lastCompletedAt: null,
      },
    });
    expect(invite.allowed).toBe(false);

    const org = evaluateClaimPolicies({
      rules: [{ kind: "organization_only", organizationIds: ["other"] }],
      worker,
      campaignOrganizationId: "org1",
      stats: {
        activeAssignmentCount: 0,
        activeAssignmentsForCampaign: 0,
        lastCompletedAt: null,
      },
    });
    expect(org.allowed).toBe(false);
  });
});

describe("reservation defaults", () => {
  it("defaults to 2 minutes", () => {
    expect(DEFAULT_RESERVATION_TIMEOUT_SECONDS).toBe(120);
  });

  it("simulates concurrent claim winner via atomic available→reserved", () => {
    // Pure concurrency model: only one updateMany(count=1) can win.
    let status: "available" | "reserved" = "available";
    function tryReserve(): boolean {
      if (status !== "available") return false;
      status = "reserved";
      return true;
    }
    expect(tryReserve()).toBe(true);
    expect(tryReserve()).toBe(false);
    expect(status).toBe("reserved");
  });

  it("duplicate assignment prevention is one-per-instance", () => {
    const claimed = new Set<string>();
    function createAssignment(instanceId: string): boolean {
      if (claimed.has(instanceId)) return false;
      claimed.add(instanceId);
      return true;
    }
    expect(createAssignment("t1")).toBe(true);
    expect(createAssignment("t1")).toBe(false);
  });
});

describe("work opportunities", () => {
  it("maps categories to worker-facing labels", () => {
    expect(opportunityCategoryLabel("app_testing")).toBe("App Testing");
    expect(opportunityCategoryLabel("ai_data")).toBe("AI Data Collection");
  });
});

describe("assignment public ids", () => {
  it("formats ASN random ids", () => {
    const id = formatRandomPublicId("assignment", "24H7QK");
    expect(id).toBe("ASN-24H7QK");
    expect(isValidPublicId("assignment", id)).toBe(true);
  });
});
