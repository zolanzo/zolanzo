/**
 * AutomationEngine — evaluate rules and dispatch actions for an event.
 * Never bypasses domain services. Never mutates domain tables directly.
 */

import {
  isAutomationEngineEnabled,
  AUTOMATION_MAX_ATTEMPTS,
} from "@/lib/automation/config";
import { executeAction } from "@/lib/automation/action-registry";
import { selectMatchingRules } from "@/lib/automation/rule-engine";
import { appendExecution } from "@/lib/automation/execution-log";
import {
  findExecutionByIdempotency,
  pushDeadLetter,
  enqueueRetry,
} from "@/lib/automation/store";
import { recordAutomationExecution } from "@/lib/automation/telemetry";
import { isKnownTrigger } from "@/lib/automation/trigger-registry";
import type {
  AutomationEvent,
  AutomationExecutionRecord,
  AutomationExecutionStatus,
} from "@/lib/automation/types";

export type ProcessEventResult = {
  executions: AutomationExecutionRecord[];
  matchedRules: number;
};

function deriveStatus(
  results: Array<{ ok: boolean }>,
  dryRun: boolean,
): AutomationExecutionStatus {
  if (dryRun) return "dry_run";
  if (results.length === 0) return "skipped";
  const ok = results.filter((r) => r.ok).length;
  if (ok === results.length) return "success";
  if (ok === 0) return "failed";
  return "partial";
}

export async function processAutomationEvent(
  event: AutomationEvent,
  options?: { attempt?: number },
): Promise<ProcessEventResult> {
  if (!isAutomationEngineEnabled()) {
    return { executions: [], matchedRules: 0 };
  }
  if (!isKnownTrigger(event.trigger)) {
    return { executions: [], matchedRules: 0 };
  }

  const attempt = options?.attempt ?? 1;
  const rules = selectMatchingRules(event);
  const executions: AutomationExecutionRecord[] = [];

  for (const rule of rules) {
    const started = Date.now();
    const idempotencyKey = `automation:${rule.id}:v${rule.version}:${event.idempotencyKey}`;
    const existing = findExecutionByIdempotency(idempotencyKey);
    if (existing && existing.status !== "failed") {
      executions.push(existing);
      continue;
    }

    const dryRun = rule.dryRun;
    const actionResults = [];
    for (const action of rule.actions) {
      const result = await executeAction({
        action,
        event,
        rule,
        dryRun,
      });
      actionResults.push(result);
    }

    const status = deriveStatus(actionResults, dryRun);
    const failed = status === "failed" || status === "partial";
    const latencyMs = Date.now() - started;

    if (failed && !dryRun && attempt < AUTOMATION_MAX_ATTEMPTS) {
      enqueueRetry({
        eventId: event.id,
        ruleId: rule.id,
        attempt: attempt + 1,
        nextRetryAt: Date.now() + attempt * 1_000,
        event,
      });
      recordAutomationExecution({
        trigger: event.trigger,
        success: false,
        retry: true,
        latencyMs,
      });
    }

    if (failed && !dryRun && attempt >= AUTOMATION_MAX_ATTEMPTS) {
      pushDeadLetter({
        executionId: "pending",
        ruleId: rule.id,
        trigger: event.trigger,
        idempotencyKey,
        errorMessage: actionResults
          .filter((r) => !r.ok)
          .map((r) => r.message)
          .join("; "),
        payload: event.payload,
      });
      recordAutomationExecution({
        trigger: event.trigger,
        success: false,
        deadLetter: true,
        latencyMs,
      });
    } else {
      recordAutomationExecution({
        trigger: event.trigger,
        success: status === "success" || status === "dry_run" || status === "skipped",
        dryRun,
        latencyMs,
      });
    }

    const record = appendExecution({
      rule,
      event,
      status: failed && attempt >= AUTOMATION_MAX_ATTEMPTS ? "dead_letter" : status,
      dryRun,
      attempt,
      actionResults,
      errorMessage: failed
        ? actionResults
            .filter((r) => !r.ok)
            .map((r) => r.message)
            .join("; ")
        : null,
      latencyMs,
      idempotencyKey,
    });
    executions.push(record);
  }

  return { executions, matchedRules: rules.length };
}

export const AutomationEngine = {
  process: processAutomationEvent,
};
