/**
 * Phase 4.4A — Workflow Automation Foundation tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AutomationService,
  ConditionEvaluator,
  TriggerRegistry,
  ActionRegistry,
  resetAutomationStoreForTests,
  resetAutomationTelemetryForTests,
  getAutomationTelemetrySnapshot,
  isAutomationEngineEnabled,
  isAutomationRulesEnabled,
  isAutomationActionsEnabled,
  AUTOMATION_ENGINE_MODEL_VERSION,
  processAutomationEvent,
} from "@/lib/automation";
import { allocateEventId } from "@/lib/automation/store";
import type { AutomationEvent } from "@/lib/automation/types";

function makeEvent(
  partial: Partial<AutomationEvent> & {
    trigger: AutomationEvent["trigger"];
    idempotencyKey: string;
  },
): AutomationEvent {
  return {
    id: allocateEventId(),
    payload: {},
    organizationId: null,
    campaignId: null,
    userId: null,
    correlationId: "corr_test",
    occurredAt: new Date().toISOString(),
    ...partial,
  };
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetAutomationStoreForTests();
  resetAutomationTelemetryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AUTOMATION_ENGINE;
  delete process.env.AUTOMATION_RULES;
  delete process.env.AUTOMATION_ACTIONS;
  // restore create_review_task builtin after potential test override
  ActionRegistry.register("create_review_task", async ({ dryRun, event, action }) => {
    const started = Date.now();
    if (dryRun) {
      return {
        actionType: "create_review_task",
        ok: true,
        dryRun: true,
        message: "Dry-run: would create review task",
        durationMs: Date.now() - started,
      };
    }
    return {
      actionType: "create_review_task",
      ok: true,
      dryRun: false,
      message: "Review task requested via automation (queued signal)",
      durationMs: Date.now() - started,
      detail: {
        submissionId: event.payload.submissionId,
        queue: action.params?.queue ?? "review",
        advisoryOnly: true,
      },
    };
  });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults automation on", () => {
    expect(isAutomationEngineEnabled()).toBe(true);
    expect(isAutomationRulesEnabled()).toBe(true);
    expect(isAutomationActionsEnabled()).toBe(true);
  });

  it("respects AUTOMATION_ENGINE=0", async () => {
    process.env.AUTOMATION_ENGINE = "0";
    const rule = AutomationService.createRule({
      name: "x",
      trigger: "assignment.accepted",
      actions: [{ type: "escalate_operations" }],
    });
    expect(rule).toBeNull();
  });
});

describe("trigger routing", () => {
  it("lists registered triggers", () => {
    expect(TriggerRegistry.list().length).toBeGreaterThanOrEqual(10);
    expect(TriggerRegistry.isKnown("payment.settled")).toBe(true);
  });

  it("routes events only to matching trigger rules", async () => {
    AutomationService.createRule({
      name: "on accept",
      trigger: "assignment.accepted",
      actions: [{ type: "escalate_operations" }],
      dryRun: true,
    });
    AutomationService.createRule({
      name: "on payment",
      trigger: "payment.settled",
      actions: [{ type: "generate_report" }],
      dryRun: true,
    });

    const result = await AutomationService.ingest({
      trigger: "assignment.accepted",
      idempotencyKey: "k1",
      payload: { assignmentId: "ASN-1" },
    });
    expect(result.matchedRules).toBe(1);
    expect(result.executions[0]?.trigger).toBe("assignment.accepted");
  });
});

describe("condition evaluation", () => {
  it("evaluates AND/OR groups", () => {
    const ctx = {
      organizationId: "org1",
      trustScore: 80,
      region: "lagos",
    };
    expect(
      ConditionEvaluator.evaluate(
        {
          logic: "and",
          conditions: [
            { field: "organizationId", op: "eq", value: "org1" },
            { field: "trustScore", op: "gte", value: 70 },
          ],
        },
        ctx,
      ),
    ).toBe(true);

    expect(
      ConditionEvaluator.evaluate(
        {
          logic: "or",
          conditions: [
            { field: "region", op: "eq", value: "abuja" },
            {
              logic: "and",
              conditions: [
                { field: "trustScore", op: "gt", value: 50 },
                { field: "region", op: "eq", value: "lagos" },
              ],
            },
          ],
        },
        ctx,
      ),
    ).toBe(true);
  });

  it("skips rules when conditions fail", async () => {
    AutomationService.createRule({
      name: "high trust only",
      trigger: "trust.updated",
      conditions: {
        logic: "and",
        conditions: [{ field: "trustScore", op: "gte", value: 90 }],
      },
      actions: [{ type: "send_notification" }],
      dryRun: true,
    });
    const result = await AutomationService.ingest({
      trigger: "trust.updated",
      idempotencyKey: "t1",
      payload: { trustScore: 40 },
    });
    expect(result.matchedRules).toBe(0);
  });
});

describe("action execution + dry-run", () => {
  it("records dry-run without failing", async () => {
    const rule = AutomationService.createRule({
      name: "notify dry",
      trigger: "submission.approved",
      actions: [{ type: "send_notification" }, { type: "escalate_operations" }],
      dryRun: true,
    });
    expect(rule?.dryRun).toBe(true);

    const result = await AutomationService.ingest({
      trigger: "submission.approved",
      idempotencyKey: "s1",
      userId: "u1",
      payload: { submissionId: "SUB-1" },
    });
    expect(result.executions[0]?.status).toBe("dry_run");
    expect(result.executions[0]?.actionResults.every((a) => a.dryRun)).toBe(
      true,
    );
    expect(result.executions[0]?.actionResults.every((a) => a.ok)).toBe(true);
  });

  it("executes escalate_operations action", async () => {
    AutomationService.createRule({
      name: "escalate",
      trigger: "submission.rejected",
      actions: [{ type: "escalate_operations", params: { reason: "test" } }],
    });
    const result = await AutomationService.ingest({
      trigger: "submission.rejected",
      idempotencyKey: "rej1",
      payload: { submissionId: "SUB-2" },
    });
    expect(result.executions[0]?.status).toBe("success");
    expect(ActionRegistry.list()).toContain("escalate_operations");
  });
});

describe("idempotency + retry + DLQ", () => {
  it("dedupes by idempotency key", async () => {
    AutomationService.createRule({
      name: "once",
      trigger: "forecast.generated",
      actions: [{ type: "escalate_operations" }],
      dryRun: true,
    });
    await AutomationService.ingest({
      trigger: "forecast.generated",
      idempotencyKey: "f1",
      payload: { confidence: 80 },
    });
    const second = await AutomationService.ingest({
      trigger: "forecast.generated",
      idempotencyKey: "f1",
      payload: { confidence: 80 },
    });
    expect(second.executions).toHaveLength(1);
    expect(getAutomationTelemetrySnapshot().executions).toBe(1);
  });

  it("retries then dead-letters failing actions", async () => {
    ActionRegistry.register("create_review_task", async () => ({
      actionType: "create_review_task",
      ok: false,
      dryRun: false,
      message: "forced failure",
      durationMs: 1,
    }));

    AutomationService.createRule({
      name: "failing",
      trigger: "report.generated",
      actions: [{ type: "create_review_task" }],
    });

    const event = makeEvent({
      trigger: "report.generated",
      idempotencyKey: "r-fail",
      payload: { reportId: "RPT-1" },
    });

    await processAutomationEvent(event, { attempt: 1 });
    expect(getAutomationTelemetrySnapshot().retries).toBeGreaterThan(0);

    // Failed executions still stored — use unique key path for final attempt
    await processAutomationEvent(
      { ...event, idempotencyKey: "r-fail-final" },
      { attempt: 3 },
    );
    expect(AutomationService.deadLetters().length).toBeGreaterThan(0);
  });
});

describe("permission checks", () => {
  it("requires actions on create", () => {
    const rule = AutomationService.createRule({
      name: "empty",
      trigger: "worker.registered",
      actions: [],
    });
    expect(rule).toBeNull();
  });

  it("supports enable/disable and version bump", () => {
    const rule = AutomationService.createRule({
      name: "toggle",
      trigger: "campaign.created",
      actions: [{ type: "refresh_analytics_snapshot" }],
      dryRun: true,
    });
    const updated = AutomationService.enableRule(rule!.id, false);
    expect(updated?.enabled).toBe(false);
    expect(updated?.version).toBe(2);
    expect(AUTOMATION_ENGINE_MODEL_VERSION).toContain("automation-engine");
  });
});
