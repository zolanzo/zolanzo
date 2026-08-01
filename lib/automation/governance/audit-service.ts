/**
 * AuditService — immutable governance audit trail.
 */

import { isAutomationAuditEnabled } from "@/lib/automation/governance/config";
import {
  allocateGovernedIds,
  appendAudit,
  listAudit,
  countAudit,
} from "@/lib/automation/governance/store";
import { bumpGovernanceCounter } from "@/lib/automation/governance/telemetry";
import type {
  AuditEvent,
  AuditEventType,
  GovernanceRole,
} from "@/lib/automation/governance/types";

function correlation(): string {
  return `gcorr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function recordAudit(input: {
  governedRuleId: string;
  type: AuditEventType;
  actorId: string;
  actorRole?: GovernanceRole | "system";
  versionNumber?: number | null;
  message: string;
  detail?: Record<string, unknown>;
  correlationId?: string;
}): AuditEvent | null {
  if (!isAutomationAuditEnabled()) return null;
  const event: AuditEvent = {
    id: allocateGovernedIds().auditId,
    governedRuleId: input.governedRuleId,
    type: input.type,
    actorId: input.actorId,
    actorRole: input.actorRole ?? "system",
    versionNumber: input.versionNumber ?? null,
    correlationId: input.correlationId ?? correlation(),
    message: input.message,
    detail: input.detail ?? {},
    createdAt: new Date().toISOString(),
  };
  appendAudit(event);
  bumpGovernanceCounter("auditEvents");
  return event;
}

export function getAuditHistory(governedRuleId: string, limit = 100): AuditEvent[] {
  return listAudit({ governedRuleId, limit });
}

export function getAllAuditEvents(limit = 200): AuditEvent[] {
  return listAudit({ limit });
}

export const AuditService = {
  record: recordAudit,
  history: getAuditHistory,
  list: getAllAuditEvents,
  count: countAudit,
};
