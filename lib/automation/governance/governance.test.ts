/**
 * Phase 4.4D — Automation Governance tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AutomationService,
  GovernanceService,
  LifecycleManager,
  PolicyValidator,
  VersionManager,
  isAutomationGovernanceEnabled,
  isAutomationApprovalsEnabled,
  AUTOMATION_GOVERNANCE_MODEL_VERSION,
  resetAutomationStoreForTests,
  resetAutomationTelemetryForTests,
  resetGovernanceStoreForTests,
  resetGovernanceTelemetryForTests,
} from "@/lib/automation";
import type { RuleContentSnapshot } from "@/lib/automation/governance/types";

const ORIGINAL_ENV = { ...process.env };

const author = { actorId: "user_author", role: "author" as const };
const approver = { actorId: "user_approver", role: "approver" as const };
const admin = { actorId: "user_admin", role: "administrator" as const };

function sampleContent(
  overrides?: Partial<RuleContentSnapshot>,
): RuleContentSnapshot {
  return {
    name: "Trust decline escalate",
    description: "Escalate declining trust",
    trigger: "trust.updated",
    conditions: {
      logic: "and",
      conditions: [{ field: "trend", op: "eq", value: "declining" }],
    },
    actions: [
      {
        type: "escalate_operations",
        params: { reason: "trust_decline", queue: "fraud" },
      },
    ],
    dryRun: false,
    priority: 40,
    permissions: ["analytics.admin"],
    ...overrides,
  };
}

async function publishHappyPath() {
  const created = GovernanceService.create({
    content: sampleContent(),
    actor: author,
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error("create failed");
  GovernanceService.configurePolicy(
    {
      ...GovernanceService.getPolicy(null),
      approvalRequired: true,
      minApprovals: 1,
      mandatorySimulationBeforePublish: true,
      maxActionsPerRule: 8,
      maxTimeoutMs: 10_000,
      restrictedTriggers: [],
      restrictedActions: [],
    },
    admin,
  );
  GovernanceService.markSimulationComplete(created.rule.id);
  const submitted = GovernanceService.submitForReview({
    governedRuleId: created.rule.id,
    actor: author,
  });
  expect(submitted.ok).toBe(true);
  const approved = GovernanceService.approve({
    governedRuleId: created.rule.id,
    actor: approver,
  });
  expect(approved.ok).toBe(true);
  const published = GovernanceService.publish({
    governedRuleId: created.rule.id,
    actor: approver,
  });
  expect(published.ok).toBe(true);
  if (!published.ok) throw new Error("publish failed");
  return published;
}

beforeEach(() => {
  resetAutomationStoreForTests();
  resetAutomationTelemetryForTests();
  resetGovernanceStoreForTests();
  resetGovernanceTelemetryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AUTOMATION_ENGINE;
  delete process.env.AUTOMATION_RULES;
  delete process.env.AUTOMATION_ACTIONS;
  delete process.env.AUTOMATION_GOVERNANCE;
  delete process.env.AUTOMATION_APPROVALS;
  delete process.env.AUTOMATION_AUDIT;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Governance — lifecycle", () => {
  it("allows draft → under_review → approved → published", async () => {
    const published = await publishHappyPath();
    expect(published.rule.lifecycle).toBe("published");
    expect(published.rule.activeVersionNumber).toBe(1);
    expect(LifecycleManager.canTransition("published", "disabled", "approver")).toBe(
      true,
    );
  });

  it("blocks illegal transitions", () => {
    expect(
      LifecycleManager.canTransition("draft", "published", "author"),
    ).toBe(false);
    expect(
      LifecycleManager.assert("archived", "draft", "administrator").ok,
    ).toBe(false);
  });
});

describe("Governance — approvals & publish", () => {
  it("syncs published content to AutomationService", async () => {
    const published = await publishHappyPath();
    const engine = AutomationService.getRule(published.engineRuleId);
    expect(engine?.enabled).toBe(true);
    expect(engine?.trigger).toBe("trust.updated");
    expect(engine?.actions[0]?.type).toBe("escalate_operations");
  });

  it("blocks publish without simulation when mandatory", () => {
    const created = GovernanceService.create({
      content: sampleContent(),
      actor: author,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    GovernanceService.submitForReview({
      governedRuleId: created.rule.id,
      actor: author,
    });
    GovernanceService.approve({
      governedRuleId: created.rule.id,
      actor: approver,
    });
    const published = GovernanceService.publish({
      governedRuleId: created.rule.id,
      actor: approver,
    });
    expect(published.ok).toBe(false);
    if (!published.ok) {
      expect(published.policy?.violations.some((v) => v.code === "mandatory_simulation")).toBe(
        true,
      );
    }
  });
});

describe("Governance — versioning & rollback", () => {
  it("creates immutable versions and compares them", () => {
    const created = GovernanceService.create({
      content: sampleContent(),
      actor: author,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const edited = GovernanceService.edit({
      governedRuleId: created.rule.id,
      content: sampleContent({
        name: "Trust decline escalate v2",
        actions: [
          {
            type: "escalate_operations",
            params: { reason: "trust_decline", queue: "fraud" },
          },
          { type: "send_notification", params: { event: "security.alert" } },
        ],
      }),
      actor: author,
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.rule.latestVersionNumber).toBe(2);
    expect(edited.diff.actionChanges.length).toBeGreaterThan(0);
    const diff = VersionManager.compareNumbers(created.rule.id, 1, 2);
    expect(diff?.summary.length).toBeGreaterThan(0);
  });

  it("rolls back to a previous published version", async () => {
    const published = await publishHappyPath();
    // edit creates v2 as draft
    const edited = GovernanceService.edit({
      governedRuleId: published.rule.id,
      content: sampleContent({
        name: "Changed name",
        priority: 10,
      }),
      actor: author,
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    GovernanceService.markSimulationComplete(edited.rule.id);
    GovernanceService.submitForReview({
      governedRuleId: edited.rule.id,
      actor: author,
    });
    GovernanceService.approve({
      governedRuleId: edited.rule.id,
      actor: approver,
    });
    const pub2 = GovernanceService.publish({
      governedRuleId: edited.rule.id,
      actor: approver,
      versionNumber: 2,
    });
    expect(pub2.ok).toBe(true);
    if (!pub2.ok) return;
    expect(pub2.rule.activeVersionNumber).toBe(2);

    const rolled = GovernanceService.rollback({
      governedRuleId: pub2.rule.id,
      targetVersion: 1,
      actor: admin,
    });
    expect(rolled.ok).toBe(true);
    if (!rolled.ok) return;
    expect(rolled.rule.activeVersionNumber).toBe(1);
    expect(rolled.rule.content.name).toBe("Trust decline escalate");
    const engine = AutomationService.getRule(rolled.engineRuleId);
    expect(engine?.name).toBe("Trust decline escalate");
  });
});

describe("Governance — policy validation", () => {
  it("rejects restricted triggers and excess actions", () => {
    GovernanceService.configurePolicy(
      {
        organizationId: null,
        approvalRequired: true,
        minApprovals: 1,
        mandatorySimulationBeforePublish: true,
        maxActionsPerRule: 1,
        maxTimeoutMs: 10_000,
        restrictedTriggers: ["payment.settled"],
        restrictedActions: ["recalculate_trust"],
      },
      admin,
    );
    const badTrigger = PolicyValidator.validate({
      content: sampleContent({ trigger: "payment.settled" }),
    });
    expect(badTrigger.ok).toBe(false);
    expect(badTrigger.violations.some((v) => v.code === "restricted_trigger")).toBe(
      true,
    );

    const tooMany = PolicyValidator.validate({
      content: sampleContent({
        actions: [
          { type: "escalate_operations" },
          { type: "send_notification", params: { event: "security.alert" } },
        ],
      }),
    });
    expect(tooMany.ok).toBe(false);
    expect(tooMany.violations.some((v) => v.code === "max_actions")).toBe(true);
  });
});

describe("Governance — audit & flags", () => {
  it("records audit history with correlation", async () => {
    const published = await publishHappyPath();
    const history = GovernanceService.audit(published.rule.id);
    const types = history.map((h) => h.type);
    expect(types).toContain("created");
    expect(types).toContain("approved");
    expect(types).toContain("published");
    expect(history.every((h) => h.correlationId.length > 0)).toBe(true);
  });

  it("respects AUTOMATION_GOVERNANCE=0", () => {
    process.env.AUTOMATION_GOVERNANCE = "0";
    expect(isAutomationGovernanceEnabled()).toBe(false);
    const created = GovernanceService.create({
      content: sampleContent(),
      actor: author,
    });
    expect(created.ok).toBe(false);
  });

  it("reports health counters", async () => {
    await publishHappyPath();
    const health = GovernanceService.health();
    expect(health.publishedVersions).toBeGreaterThanOrEqual(1);
    expect(health.auditEvents).toBeGreaterThan(0);
    expect(AUTOMATION_GOVERNANCE_MODEL_VERSION).toContain("governance");
    expect(isAutomationApprovalsEnabled()).toBe(true);
  });

  it("disables engine rule when governance disables", async () => {
    const published = await publishHappyPath();
    const disabled = GovernanceService.disable({
      governedRuleId: published.rule.id,
      actor: approver,
    });
    expect(disabled.ok).toBe(true);
    const engine = AutomationService.getRule(published.engineRuleId);
    expect(engine?.enabled).toBe(false);
  });
});
