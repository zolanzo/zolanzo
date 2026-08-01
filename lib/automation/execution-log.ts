/**
 * ExecutionLog — immutable automation execution history helpers.
 */

import {
  listDeadLetters,
  listExecutions,
  storeExecution,
} from "@/lib/automation/store";
import type {
  ActionExecutionResult,
  AutomationExecutionRecord,
  AutomationExecutionStatus,
  AutomationEvent,
  AutomationRule,
} from "@/lib/automation/types";

export function appendExecution(params: {
  rule: AutomationRule;
  event: AutomationEvent;
  status: AutomationExecutionStatus;
  dryRun: boolean;
  attempt: number;
  actionResults: ActionExecutionResult[];
  errorMessage?: string | null;
  latencyMs: number;
  idempotencyKey: string;
}): AutomationExecutionRecord {
  return storeExecution({
    ruleId: params.rule.id,
    rulePublicId: params.rule.publicId,
    ruleVersion: params.rule.version,
    trigger: params.event.trigger,
    eventId: params.event.id,
    correlationId: params.event.correlationId,
    idempotencyKey: params.idempotencyKey,
    status: params.status,
    dryRun: params.dryRun,
    attempt: params.attempt,
    actionResults: params.actionResults,
    errorMessage: params.errorMessage ?? null,
    latencyMs: params.latencyMs,
    createdAt: new Date().toISOString(),
  });
}

export function getExecutionHistory(limit = 100): AutomationExecutionRecord[] {
  return listExecutions(limit);
}

export function getDeadLetterQueue() {
  return listDeadLetters();
}

export const ExecutionLog = {
  append: appendExecution,
  list: getExecutionHistory,
  deadLetters: getDeadLetterQueue,
};
