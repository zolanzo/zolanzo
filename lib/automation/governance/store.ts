/**
 * In-memory governance store — rules, versions, approvals, audit, policies.
 */

import type {
  ApprovalRequest,
  AuditEvent,
  GovernedRule,
  GovernedRuleVersion,
  GovernancePolicy,
} from "@/lib/automation/governance/types";

let seq = 0;
const rules = new Map<string, GovernedRule>();
const versions = new Map<string, GovernedRuleVersion[]>();
const approvals = new Map<string, ApprovalRequest>();
const auditLog: AuditEvent[] = [];
const policies = new Map<string, GovernancePolicy>();

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

function nextPublicId(prefix: string): string {
  seq += 1;
  const body = seq.toString(36).toUpperCase().padStart(6, "2").slice(-6);
  return `${prefix}-${body}`;
}

export function resetGovernanceStoreForTests(): void {
  seq = 0;
  rules.clear();
  versions.clear();
  approvals.clear();
  auditLog.length = 0;
  policies.clear();
}

export function allocateGovernedIds() {
  return {
    id: nextId("grule"),
    publicId: nextPublicId("GRL"),
    versionId: nextId("gver"),
    approvalId: nextId("gappr"),
    auditId: nextId("gaud"),
  };
}

export function saveGovernedRule(rule: GovernedRule): GovernedRule {
  rules.set(rule.id, rule);
  return rule;
}

export function getGovernedRule(id: string): GovernedRule | null {
  return rules.get(id) ?? null;
}

export function listGovernedRules(filter?: {
  organizationId?: string | null;
  lifecycle?: string;
  includeDeleted?: boolean;
}): GovernedRule[] {
  let rows = [...rules.values()];
  if (!filter?.includeDeleted) {
    rows = rows.filter((r) => !r.softDeleted);
  }
  if (filter?.organizationId !== undefined) {
    rows = rows.filter((r) => r.organizationId === filter.organizationId);
  }
  if (filter?.lifecycle) {
    rows = rows.filter((r) => r.lifecycle === filter.lifecycle);
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveVersion(
  governedRuleId: string,
  version: GovernedRuleVersion,
): void {
  const list = versions.get(governedRuleId) ?? [];
  list.push(version);
  versions.set(governedRuleId, list);
}

export function listVersions(governedRuleId: string): GovernedRuleVersion[] {
  return [...(versions.get(governedRuleId) ?? [])].sort(
    (a, b) => a.versionNumber - b.versionNumber,
  );
}

export function getVersion(
  governedRuleId: string,
  versionNumber: number,
): GovernedRuleVersion | null {
  return (
    listVersions(governedRuleId).find((v) => v.versionNumber === versionNumber) ??
    null
  );
}

export function saveApproval(req: ApprovalRequest): ApprovalRequest {
  approvals.set(req.id, req);
  return req;
}

export function getApproval(id: string): ApprovalRequest | null {
  return approvals.get(id) ?? null;
}

export function listApprovals(filter?: {
  governedRuleId?: string;
  status?: ApprovalRequest["status"];
}): ApprovalRequest[] {
  let rows = [...approvals.values()];
  if (filter?.governedRuleId) {
    rows = rows.filter((a) => a.governedRuleId === filter.governedRuleId);
  }
  if (filter?.status) {
    rows = rows.filter((a) => a.status === filter.status);
  }
  return rows.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export function appendAudit(event: AuditEvent): void {
  auditLog.push(event);
}

export function listAudit(filter?: {
  governedRuleId?: string;
  limit?: number;
}): AuditEvent[] {
  let rows = [...auditLog];
  if (filter?.governedRuleId) {
    rows = rows.filter((e) => e.governedRuleId === filter.governedRuleId);
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.limit) rows = rows.slice(0, filter.limit);
  return rows;
}

export function countAudit(): number {
  return auditLog.length;
}

const DEFAULT_POLICY: GovernancePolicy = {
  organizationId: null,
  approvalRequired: true,
  minApprovals: 1,
  mandatorySimulationBeforePublish: true,
  maxActionsPerRule: 8,
  maxTimeoutMs: 5000,
  restrictedTriggers: [],
  restrictedActions: [],
};

export function getPolicy(organizationId?: string | null): GovernancePolicy {
  const key = organizationId ?? "__global__";
  return policies.get(key) ?? { ...DEFAULT_POLICY, organizationId: organizationId ?? null };
}

export function setPolicy(policy: GovernancePolicy): GovernancePolicy {
  const key = policy.organizationId ?? "__global__";
  policies.set(key, policy);
  return policy;
}

export { nextId, nextPublicId };
