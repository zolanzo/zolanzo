/**
 * Phase 4.4C — Visual Rule Builder tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ActionBuilder,
  AutomationService,
  ConditionBuilder,
  RuleBuilderService,
  RuleSerializer,
  RuleValidator,
  SimulationEngine,
  TriggerPicker,
  AUTOMATION_BUILDER_MODEL_VERSION,
  isAutomationBuilderEnabled,
  isAutomationImportExportEnabled,
  isAutomationSimulationEnabled,
  resetAutomationStoreForTests,
  resetAutomationTelemetryForTests,
  resetBuilderTelemetryForTests,
} from "@/lib/automation";
import type { RuleDraft } from "@/lib/automation/builder/types";

const ORIGINAL_ENV = { ...process.env };

function sampleDraft(overrides?: Partial<RuleDraft>): RuleDraft {
  return RuleBuilderService.emptyDraft({
    name: "Trust decline escalate",
    description: "Escalate when trust declines",
    trigger: "trust.updated",
    conditions: ConditionBuilder.add(
      ConditionBuilder.empty("and"),
      ConditionBuilder.atom("trend", "eq", "declining"),
    ),
    actions: [
      ActionBuilder.build("escalate_operations", {
        reason: "trust_decline",
        queue: "fraud",
      }),
    ],
    permissions: ["analytics.admin"],
    ...overrides,
  });
}

beforeEach(() => {
  resetAutomationStoreForTests();
  resetAutomationTelemetryForTests();
  resetBuilderTelemetryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AUTOMATION_ENGINE;
  delete process.env.AUTOMATION_RULES;
  delete process.env.AUTOMATION_ACTIONS;
  delete process.env.AUTOMATION_BUILDER;
  delete process.env.AUTOMATION_SIMULATION;
  delete process.env.AUTOMATION_IMPORT_EXPORT;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Rule Builder — catalogs", () => {
  it("groups triggers by category", () => {
    const byCat = TriggerPicker.byCategory();
    expect(byCat.assignments.length).toBeGreaterThan(0);
    expect(byCat.workers.length).toBeGreaterThan(0);
    expect(byCat.trust.some((t) => t.type === "trust.updated")).toBe(true);
    const entry = TriggerPicker.get("payment.settled");
    expect(entry?.payloadFields).toContain("paymentStatus");
    expect(entry?.requiredPermissions.length).toBeGreaterThan(0);
  });

  it("lists actions with schemas and cost metadata", () => {
    const actions = ActionBuilder.list();
    expect(actions.length).toBe(8);
    expect(actions.every((a) => a.timeoutMs > 0)).toBe(true);
    expect(actions.every((a) => a.estimatedCost >= 1)).toBe(true);
  });
});

describe("Rule Builder — validation", () => {
  it("accepts a complete draft", () => {
    const result = RuleValidator.validate(sampleDraft());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects unknown trigger and empty actions", () => {
    const result = RuleValidator.validate(
      sampleDraft({
        name: "",
        trigger: "not.real" as RuleDraft["trigger"],
        actions: [],
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "empty_name")).toBe(true);
    expect(result.errors.some((e) => e.code === "unknown_trigger")).toBe(true);
    expect(result.errors.some((e) => e.code === "empty_actions")).toBe(true);
  });

  it("checks actor permissions", () => {
    const result = RuleValidator.validate(sampleDraft(), {
      actorPermissions: ["analytics.read"],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "permission_mismatch")).toBe(
      true,
    );
  });

  it("warns on incompatible builder major version", () => {
    const result = RuleValidator.validate(
      sampleDraft({ builderVersion: "automation-builder/2.0.0" }),
    );
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.code === "version_incompatible")).toBe(
      true,
    );
  });
});

describe("Rule Builder — nested conditions", () => {
  it("builds nested AND/OR trees", () => {
    const inner = ConditionBuilder.add(
      ConditionBuilder.empty("or"),
      ConditionBuilder.atom("confidence", "lt", 50),
    );
    const outer = ConditionBuilder.nest(
      ConditionBuilder.add(
        ConditionBuilder.empty("and"),
        ConditionBuilder.atom("trustScore", "lt", 70),
      ),
      inner,
    );
    const summary = ConditionBuilder.summarize(outer);
    expect(summary.some((l) => l.includes("AND"))).toBe(true);
    expect(summary.some((l) => l.includes("OR"))).toBe(true);
    expect(summary.some((l) => l.includes("trustScore"))).toBe(true);
  });
});

describe("Rule Builder — create / preview / clone", () => {
  it("creates rules only via AutomationService", () => {
    const before = AutomationService.listRules().length;
    const result = RuleBuilderService.create(sampleDraft(), {
      actorPermissions: ["analytics.admin", "analytics.read"],
    });
    expect(result.ok).toBe(true);
    expect(result.rule?.trigger).toBe("trust.updated");
    expect(AutomationService.listRules().length).toBe(before + 1);
    expect(result.preview?.estimatedExecutionFlow.length).toBeGreaterThan(0);
  });

  it("prefills from library template", () => {
    const prefill = RuleBuilderService.prefillFromTemplate("worker.welcome");
    expect(prefill.ok).toBe(true);
    expect(prefill.draft?.trigger).toBe("worker.registered");
    expect(prefill.draft?.sourceTemplateId).toBe("worker.welcome");
  });

  it("clones an existing rule into a draft", () => {
    const created = RuleBuilderService.create(sampleDraft());
    expect(created.ok).toBe(true);
    const cloned = RuleBuilderService.clone(created.rule!.id);
    expect(cloned.ok).toBe(true);
    expect(cloned.draft?.name).toContain("(copy)");
    expect(cloned.draft?.enabled).toBe(false);
  });
});

describe("Rule Builder — simulation", () => {
  it("dry-runs without executing actions", () => {
    const result = SimulationEngine.simulate({
      draft: sampleDraft(),
      samplePayload: { trend: "declining", trustScore: 40 },
    });
    expect(result.dryRun).toBe(true);
    expect(result.conditionsMatched).toBe(true);
    expect(result.actionsWouldExecute.length).toBe(1);
    expect(result.estimatedLatencyMs).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("dry-run"))).toBe(true);
  });

  it("skips actions when conditions miss", () => {
    const result = SimulationEngine.simulate({
      draft: sampleDraft(),
      samplePayload: { trend: "stable" },
    });
    expect(result.conditionsMatched).toBe(false);
    expect(result.actionsWouldExecute).toEqual([]);
  });
});

describe("Rule Builder — import/export", () => {
  it("round-trips JSON", () => {
    const exported = RuleSerializer.exportJson(sampleDraft());
    expect(exported.ok).toBe(true);
    const imported = RuleSerializer.importJson(exported.json!);
    expect(imported.ok).toBe(true);
    expect(imported.draft?.trigger).toBe("trust.updated");
    expect(imported.draft?.actions[0]?.type).toBe("escalate_operations");
  });

  it("respects AUTOMATION_IMPORT_EXPORT=0", () => {
    process.env.AUTOMATION_IMPORT_EXPORT = "0";
    expect(isAutomationImportExportEnabled()).toBe(false);
    const exported = RuleSerializer.exportJson(sampleDraft());
    expect(exported.ok).toBe(false);
  });
});

describe("Rule Builder — feature flags", () => {
  it("defaults builder flags on", () => {
    expect(isAutomationBuilderEnabled()).toBe(true);
    expect(isAutomationSimulationEnabled()).toBe(true);
    expect(isAutomationImportExportEnabled()).toBe(true);
    expect(AUTOMATION_BUILDER_MODEL_VERSION).toContain("automation-builder");
  });

  it("respects AUTOMATION_BUILDER=0", () => {
    process.env.AUTOMATION_BUILDER = "0";
    expect(isAutomationBuilderEnabled()).toBe(false);
    const result = RuleBuilderService.create(sampleDraft());
    expect(result.ok).toBe(false);
  });

  it("reports builder health", () => {
    RuleBuilderService.create(sampleDraft());
    RuleBuilderService.simulate({
      draft: sampleDraft(),
      samplePayload: { trend: "declining" },
    });
    const health = RuleBuilderService.health();
    expect(health.rulesCreated).toBe(1);
    expect(health.simulationsRun).toBe(1);
    expect(health.averageBuildTimeMs).toBeGreaterThanOrEqual(0);
  });
});
