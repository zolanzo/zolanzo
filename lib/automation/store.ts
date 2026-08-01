/**
 * In-memory automation store — rules, executions, DLQ, idempotency.
 */

import type {
  AutomationDeadLetter,
  AutomationExecutionRecord,
  AutomationRule,
  CreateAutomationRuleInput,
} from "@/lib/automation/types";

let seq = 0;
const rules = new Map<string, AutomationRule>();
const executions = new Map<string, AutomationExecutionRecord>();
const idempotency = new Map<string, string>();
const deadLetters: AutomationDeadLetter[] = [];
const pendingRetries: Array<{
  eventId: string;
  ruleId: string;
  attempt: number;
  nextRetryAt: number;
  event: import("@/lib/automation/types").AutomationEvent;
}> = [];

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

function nextPublicId(prefix: string): string {
  seq += 1;
  const body = seq.toString(36).toUpperCase().padStart(6, "2").slice(-6);
  return `${prefix}-${body}`;
}

export function resetAutomationStoreForTests(): void {
  seq = 0;
  rules.clear();
  executions.clear();
  idempotency.clear();
  deadLetters.length = 0;
  pendingRetries.length = 0;
}

export function createRule(input: CreateAutomationRuleInput): AutomationRule {
  const now = new Date().toISOString();
  const rule: AutomationRule = {
    id: nextId("arule"),
    publicId: nextPublicId("ARL"),
    name: input.name,
    description: input.description ?? "",
    trigger: input.trigger,
    conditions: input.conditions ?? null,
    actions: input.actions,
    enabled: input.enabled ?? true,
    dryRun: input.dryRun ?? false,
    priority: input.priority ?? 100,
    version: 1,
    organizationId: input.organizationId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  rules.set(rule.id, rule);
  return rule;
}

export function updateRule(
  id: string,
  patch: Partial<
    Pick<
      AutomationRule,
      | "name"
      | "description"
      | "conditions"
      | "actions"
      | "enabled"
      | "dryRun"
      | "priority"
    >
  >,
): AutomationRule | null {
  const existing = rules.get(id);
  if (!existing) return null;
  const next: AutomationRule = {
    ...existing,
    ...patch,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };
  rules.set(id, next);
  return next;
}

export function getRule(id: string): AutomationRule | null {
  return rules.get(id) ?? null;
}

export function listRules(filter?: {
  trigger?: string;
  enabled?: boolean;
  organizationId?: string | null;
}): AutomationRule[] {
  let rows = [...rules.values()];
  if (filter?.trigger)
    rows = rows.filter((r) => r.trigger === filter.trigger);
  if (filter?.enabled != null)
    rows = rows.filter((r) => r.enabled === filter.enabled);
  if (filter?.organizationId !== undefined)
    rows = rows.filter(
      (r) =>
        r.organizationId == null ||
        r.organizationId === filter.organizationId,
    );
  return rows.sort((a, b) => a.priority - b.priority);
}

export function findExecutionByIdempotency(
  key: string,
): AutomationExecutionRecord | null {
  const id = idempotency.get(key);
  if (!id) return null;
  return executions.get(id) ?? null;
}

export function storeExecution(
  record: Omit<AutomationExecutionRecord, "id" | "publicId"> & {
    id?: string;
    publicId?: string;
  },
): AutomationExecutionRecord {
  const full: AutomationExecutionRecord = {
    ...record,
    id: record.id ?? nextId("aexec"),
    publicId: record.publicId ?? nextPublicId("AEX"),
  };
  executions.set(full.id, full);
  idempotency.set(full.idempotencyKey, full.id);
  return full;
}

export function listExecutions(limit = 100): AutomationExecutionRecord[] {
  return [...executions.values()]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export function pushDeadLetter(
  entry: Omit<AutomationDeadLetter, "id" | "createdAt">,
): AutomationDeadLetter {
  const full: AutomationDeadLetter = {
    ...entry,
    id: nextId("adlq"),
    createdAt: new Date().toISOString(),
  };
  deadLetters.push(full);
  return full;
}

export function listDeadLetters(): AutomationDeadLetter[] {
  return [...deadLetters];
}

export function enqueueRetry(item: {
  eventId: string;
  ruleId: string;
  attempt: number;
  nextRetryAt: number;
  event: import("@/lib/automation/types").AutomationEvent;
}): void {
  pendingRetries.push(item);
}

export function drainDueRetries(now = Date.now()): typeof pendingRetries {
  const due: typeof pendingRetries = [];
  const remain: typeof pendingRetries = [];
  for (const item of pendingRetries) {
    if (item.nextRetryAt <= now) due.push(item);
    else remain.push(item);
  }
  pendingRetries.length = 0;
  pendingRetries.push(...remain);
  return due;
}

export function allocateEventId(): string {
  return nextId("aevt");
}

export function countActiveRules(): number {
  return [...rules.values()].filter((r) => r.enabled).length;
}
