/**
 * AutomationService — public API for Workflow Automation Foundation.
 */

import { isAutomationEngineEnabled, isAutomationRulesEnabled } from "@/lib/automation/config";
import { processAutomationEvent } from "@/lib/automation/automation-engine";
import { runAutomationScheduler } from "@/lib/automation/automation-scheduler";
import {
  createRule,
  updateRule,
  getRule,
  listRules,
  allocateEventId,
  countActiveRules,
} from "@/lib/automation/store";
import { getExecutionHistory, getDeadLetterQueue } from "@/lib/automation/execution-log";
import { listTriggers } from "@/lib/automation/trigger-registry";
import { listActions } from "@/lib/automation/action-registry";
import type {
  AutomationEvent,
  AutomationRule,
  AutomationTriggerType,
  CreateAutomationRuleInput,
} from "@/lib/automation/types";

function newCorrelationId(): string {
  return `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createAutomationRule(
  input: CreateAutomationRuleInput,
): AutomationRule | null {
  if (!isAutomationEngineEnabled() || !isAutomationRulesEnabled()) return null;
  if (!input.actions.length) return null;
  return createRule(input);
}

export function updateAutomationRule(
  id: string,
  patch: Parameters<typeof updateRule>[1],
): AutomationRule | null {
  if (!isAutomationRulesEnabled()) return null;
  return updateRule(id, patch);
}

export function enableAutomationRule(id: string, enabled: boolean): AutomationRule | null {
  return updateAutomationRule(id, { enabled });
}

export function setAutomationRuleDryRun(
  id: string,
  dryRun: boolean,
): AutomationRule | null {
  return updateAutomationRule(id, { dryRun });
}

export function listAutomationRules(filter?: {
  trigger?: AutomationTriggerType;
  enabled?: boolean;
  organizationId?: string | null;
}): AutomationRule[] {
  return listRules(filter);
}

export function getAutomationRule(id: string): AutomationRule | null {
  return getRule(id);
}

export async function ingestAutomationEvent(input: {
  trigger: AutomationTriggerType;
  payload?: Record<string, unknown>;
  organizationId?: string | null;
  campaignId?: string | null;
  userId?: string | null;
  idempotencyKey: string;
  correlationId?: string;
  occurredAt?: string;
}): Promise<Awaited<ReturnType<typeof processAutomationEvent>>> {
  if (!isAutomationEngineEnabled()) {
    return { executions: [], matchedRules: 0 };
  }
  const event: AutomationEvent = {
    id: allocateEventId(),
    trigger: input.trigger,
    payload: input.payload ?? {},
    organizationId: input.organizationId ?? null,
    campaignId: input.campaignId ?? null,
    userId: input.userId ?? null,
    correlationId: input.correlationId ?? newCorrelationId(),
    idempotencyKey: input.idempotencyKey,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
  return processAutomationEvent(event);
}

export const AutomationService = {
  createRule: createAutomationRule,
  updateRule: updateAutomationRule,
  enableRule: enableAutomationRule,
  setDryRun: setAutomationRuleDryRun,
  listRules: listAutomationRules,
  getRule: getAutomationRule,
  ingest: ingestAutomationEvent,
  history: getExecutionHistory,
  deadLetters: getDeadLetterQueue,
  runScheduler: runAutomationScheduler,
  listTriggers,
  listActions,
  countActiveRules,
};
