/**
 * GovernanceService — enterprise lifecycle for automation rules.
 * Does not execute automations; syncs published content to AutomationService.
 */

import { AutomationService } from "@/lib/automation/automation-service";
import type { AutomationTriggerType } from "@/lib/automation/types";
import {
  isAutomationApprovalsEnabled,
  isAutomationAuditEnabled,
  isAutomationGovernanceEnabled,
} from "@/lib/automation/governance/config";
import { LifecycleManager } from "@/lib/automation/governance/lifecycle-manager";
import { ApprovalEngine } from "@/lib/automation/governance/approval-engine";
import { VersionManager } from "@/lib/automation/governance/version-manager";
import { PolicyValidator } from "@/lib/automation/governance/policy-validator";
import { AuditService } from "@/lib/automation/governance/audit-service";
import { RollbackService } from "@/lib/automation/governance/rollback-service";
import {
  allocateGovernedIds,
  getGovernedRule,
  getPolicy,
  listApprovals,
  listGovernedRules,
  listVersions,
  saveGovernedRule,
  setPolicy,
  countAudit,
} from "@/lib/automation/governance/store";
import {
  getGovernanceTelemetrySnapshot,
  setGovernanceHealthSnapshot,
} from "@/lib/automation/governance/telemetry";
import type {
  ChangeReviewDiff,
  GovernancePolicy,
  GovernanceRole,
  GovernedRule,
  PolicyValidationResult,
  RuleContentSnapshot,
} from "@/lib/automation/governance/types";
import { AUTOMATION_GOVERNANCE_MODEL_VERSION } from "@/lib/automation/governance/types";

export type ActorContext = {
  actorId: string;
  role: GovernanceRole;
};

function refreshHealthCounters(): void {
  const all = listGovernedRules({ includeDeleted: false });
  setGovernanceHealthSnapshot({
    draftRules: all.filter((r) => r.lifecycle === "draft").length,
    underReview: all.filter((r) => r.lifecycle === "under_review").length,
    pendingApprovals: listApprovals({ status: "pending" }).length,
    publishedVersions: all.filter((r) => r.lifecycle === "published").length,
    disabledRules: all.filter((r) => r.lifecycle === "disabled").length,
    archivedRules: all.filter((r) => r.lifecycle === "archived").length,
    auditEvents: countAudit(),
    rollbacks: getGovernanceTelemetrySnapshot().rollbacks,
    policyViolations: getGovernanceTelemetrySnapshot().policyViolations,
  });
}

function syncEngineRule(rule: GovernedRule, enabled: boolean): string | null {
  const content = rule.content;
  if (rule.engineRuleId) {
    AutomationService.updateRule(rule.engineRuleId, {
      name: content.name,
      description: content.description,
      conditions: content.conditions,
      actions: content.actions,
      dryRun: content.dryRun,
      priority: content.priority,
      enabled,
    });
    return rule.engineRuleId;
  }
  const created = AutomationService.createRule({
    name: content.name,
    description: content.description,
    trigger: content.trigger,
    conditions: content.conditions,
    actions: content.actions,
    dryRun: content.dryRun,
    priority: content.priority,
    organizationId: rule.organizationId,
    enabled,
  });
  return created?.id ?? null;
}

export function createGovernedRule(params: {
  content: RuleContentSnapshot;
  organizationId?: string | null;
  actor: ActorContext;
}): { ok: true; rule: GovernedRule } | { ok: false; error: string } {
  if (!isAutomationGovernanceEnabled()) {
    return { ok: false, error: "AUTOMATION_GOVERNANCE disabled" };
  }
  if (params.actor.role !== "author" && params.actor.role !== "administrator") {
    return { ok: false, error: "Only authors can create governed rules" };
  }
  const policyCheck = PolicyValidator.validate({ content: params.content });
  if (!policyCheck.ok) {
    return {
      ok: false,
      error: policyCheck.violations.map((v) => v.message).join("; "),
    };
  }

  const ids = allocateGovernedIds();
  const now = new Date().toISOString();
  const rule: GovernedRule = {
    id: ids.id,
    publicId: ids.publicId,
    organizationId: params.organizationId ?? null,
    engineRuleId: null,
    lifecycle: "draft",
    content: structuredClone(params.content),
    activeVersionNumber: null,
    latestVersionNumber: 1,
    authorId: params.actor.actorId,
    createdAt: now,
    updatedAt: now,
    softDeleted: false,
    simulationCompleted: false,
    pendingApproverIds: [],
    approvedBy: [],
  };
  saveGovernedRule(rule);
  VersionManager.create({
    governedRuleId: rule.id,
    versionNumber: 1,
    content: rule.content,
    createdBy: params.actor.actorId,
    note: "Initial draft",
  });
  AuditService.record({
    governedRuleId: rule.id,
    type: "created",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber: 1,
    message: `Created governed rule ${rule.publicId}`,
  });
  refreshHealthCounters();
  return { ok: true, rule };
}

export function editGovernedRule(params: {
  governedRuleId: string;
  content: RuleContentSnapshot;
  actor: ActorContext;
  note?: string;
}):
  | { ok: true; rule: GovernedRule; diff: ChangeReviewDiff }
  | { ok: false; error: string } {
  if (!isAutomationGovernanceEnabled()) {
    return { ok: false, error: "AUTOMATION_GOVERNANCE disabled" };
  }
  const existing = getGovernedRule(params.governedRuleId);
  if (!existing || existing.softDeleted) {
    return { ok: false, error: "Governed rule not found" };
  }
  if (
    existing.lifecycle !== "draft" &&
    existing.lifecycle !== "approved" &&
    existing.lifecycle !== "disabled" &&
    existing.lifecycle !== "published"
  ) {
    return {
      ok: false,
      error: `Cannot edit in lifecycle ${existing.lifecycle}`,
    };
  }
  const policyCheck = PolicyValidator.validate({ content: params.content });
  if (!policyCheck.ok) {
    AuditService.record({
      governedRuleId: existing.id,
      type: "policy_violation",
      actorId: params.actor.actorId,
      actorRole: params.actor.role,
      message: "Edit blocked by policy",
      detail: { violations: policyCheck.violations },
    });
    return {
      ok: false,
      error: policyCheck.violations.map((v) => v.message).join("; "),
    };
  }

  const diff = VersionManager.compare(existing.content, params.content);
  const nextVersion = existing.latestVersionNumber + 1;
  VersionManager.create({
    governedRuleId: existing.id,
    versionNumber: nextVersion,
    content: params.content,
    createdBy: params.actor.actorId,
    note: params.note ?? "Edit",
  });

  const updated: GovernedRule = {
    ...existing,
    content: structuredClone(params.content),
    latestVersionNumber: nextVersion,
    lifecycle: "draft",
    approvedBy: [],
    simulationCompleted: false,
    updatedAt: new Date().toISOString(),
  };
  saveGovernedRule(updated);
  AuditService.record({
    governedRuleId: updated.id,
    type: "edited",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber: nextVersion,
    message: `Edited to v${nextVersion}`,
    detail: { summary: diff.summary },
  });
  refreshHealthCounters();
  return { ok: true, rule: updated, diff };
}

export function submitForReview(params: {
  governedRuleId: string;
  actor: ActorContext;
}): { ok: true; rule: GovernedRule } | { ok: false; error: string } {
  if (!isAutomationGovernanceEnabled()) {
    return { ok: false, error: "AUTOMATION_GOVERNANCE disabled" };
  }
  const rule = getGovernedRule(params.governedRuleId);
  if (!rule || rule.softDeleted) return { ok: false, error: "Not found" };
  const transition = LifecycleManager.assert(
    rule.lifecycle,
    "under_review",
    params.actor.role,
  );
  if (!transition.ok) return transition;

  const policy = getPolicy(rule.organizationId);
  const needsApproval =
    policy.approvalRequired && isAutomationApprovalsEnabled();

  if (needsApproval) {
    const req = ApprovalEngine.request({
      governedRuleId: rule.id,
      versionNumber: rule.latestVersionNumber,
      requestedBy: params.actor.actorId,
    });
    if ("error" in req) return { ok: false, error: req.error };
  }

  // When approvals are not required, auto-advance to approved.
  const nextLifecycle = needsApproval ? "under_review" : "approved";
  if (nextLifecycle === "approved") {
    const toApproved = LifecycleManager.assert(
      "under_review",
      "approved",
      "administrator",
    );
    if (!toApproved.ok) return toApproved;
  }

  const updated: GovernedRule = {
    ...rule,
    lifecycle: nextLifecycle,
    approvedBy: needsApproval
      ? rule.approvedBy
      : [...new Set([...rule.approvedBy, params.actor.actorId])],
    updatedAt: new Date().toISOString(),
  };
  saveGovernedRule(updated);
  AuditService.record({
    governedRuleId: rule.id,
    type: "submitted_for_review",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber: rule.latestVersionNumber,
    message: needsApproval
      ? "Submitted for review"
      : "Submitted and auto-approved (approvals not required)",
  });
  if (!needsApproval) {
    AuditService.record({
      governedRuleId: rule.id,
      type: "approved",
      actorId: params.actor.actorId,
      actorRole: params.actor.role,
      versionNumber: rule.latestVersionNumber,
      message: "Auto-approved by policy",
    });
  }
  refreshHealthCounters();
  return { ok: true, rule: updated };
}

export function approveRule(params: {
  governedRuleId: string;
  actor: ActorContext;
  approvalId?: string;
  comment?: string;
}): { ok: true; rule: GovernedRule } | { ok: false; error: string } {
  if (!isAutomationGovernanceEnabled()) {
    return { ok: false, error: "AUTOMATION_GOVERNANCE disabled" };
  }
  const rule = getGovernedRule(params.governedRuleId);
  if (!rule || rule.softDeleted) return { ok: false, error: "Not found" };

  if (isAutomationApprovalsEnabled()) {
    let approvalId = params.approvalId;
    if (!approvalId) {
      const pending = listApprovals({
        governedRuleId: rule.id,
        status: "pending",
      })[0];
      approvalId = pending?.id;
    }
    if (approvalId) {
      const decided = ApprovalEngine.decide({
        approvalId,
        decide: "approved",
        decidedBy: params.actor.actorId,
        role: params.actor.role,
        comment: params.comment,
      });
      if ("error" in decided) return { ok: false, error: decided.error };
    }
  }

  const transition = LifecycleManager.assert(
    rule.lifecycle,
    "approved",
    params.actor.role,
  );
  if (!transition.ok) return transition;

  const approvedBy = [...new Set([...rule.approvedBy, params.actor.actorId])];
  const updated: GovernedRule = {
    ...rule,
    lifecycle: "approved",
    approvedBy,
    updatedAt: new Date().toISOString(),
  };
  saveGovernedRule(updated);
  AuditService.record({
    governedRuleId: rule.id,
    type: "approved",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber: rule.latestVersionNumber,
    message: "Rule approved",
    detail: { comment: params.comment ?? null },
  });
  refreshHealthCounters();
  return { ok: true, rule: updated };
}

export function markSimulationComplete(governedRuleId: string): boolean {
  const rule = getGovernedRule(governedRuleId);
  if (!rule) return false;
  saveGovernedRule({
    ...rule,
    simulationCompleted: true,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export function publishRule(params: {
  governedRuleId: string;
  actor: ActorContext;
  versionNumber?: number;
}):
  | { ok: true; rule: GovernedRule; engineRuleId: string }
  | { ok: false; error: string; policy?: PolicyValidationResult } {
  if (!isAutomationGovernanceEnabled()) {
    return { ok: false, error: "AUTOMATION_GOVERNANCE disabled" };
  }
  const rule = getGovernedRule(params.governedRuleId);
  if (!rule || rule.softDeleted) return { ok: false, error: "Not found" };

  const versionNumber = params.versionNumber ?? rule.latestVersionNumber;
  const version = VersionManager.get(rule.id, versionNumber);
  if (!version) return { ok: false, error: `Version ${versionNumber} not found` };

  const content = version.content;
  const working: GovernedRule = {
    ...rule,
    content,
    lifecycle: rule.lifecycle === "disabled" ? "approved" : rule.lifecycle,
  };

  const policy = PolicyValidator.validate({
    content,
    rule: working,
    forPublish: true,
  });
  // Allow publish from approved; if approvals disabled, skip approval_required
  if (!isAutomationApprovalsEnabled() || !getPolicy(rule.organizationId).approvalRequired) {
    policy.violations = policy.violations.filter(
      (v) => v.code !== "approval_required",
    );
    policy.ok = !policy.violations.some((v) => v.severity === "error");
  }
  // Fix invalid_lifecycle when we're on approved
  if (rule.lifecycle === "approved" || rule.lifecycle === "disabled") {
    policy.violations = policy.violations.filter(
      (v) => v.code !== "invalid_lifecycle",
    );
    policy.ok = !policy.violations.some((v) => v.severity === "error");
  }

  if (!policy.ok) {
    AuditService.record({
      governedRuleId: rule.id,
      type: "policy_violation",
      actorId: params.actor.actorId,
      actorRole: params.actor.role,
      message: "Publish blocked by policy",
      detail: { violations: policy.violations },
    });
    return { ok: false, error: "Policy validation failed", policy };
  }

  const transition = LifecycleManager.assert(
    rule.lifecycle === "disabled" ? "disabled" : "approved",
    "published",
    params.actor.role,
  );
  if (!transition.ok) return transition;

  const toPublish: GovernedRule = {
    ...rule,
    content: structuredClone(content),
    lifecycle: "published",
    activeVersionNumber: versionNumber,
    updatedAt: new Date().toISOString(),
  };
  const engineRuleId = syncEngineRule(toPublish, true);
  if (!engineRuleId) {
    return { ok: false, error: "Failed to sync AutomationService rule" };
  }
  toPublish.engineRuleId = engineRuleId;
  VersionManager.markPublished(rule.id, versionNumber);
  saveGovernedRule(toPublish);
  AuditService.record({
    governedRuleId: rule.id,
    type: "published",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber,
    message: `Published v${versionNumber}`,
    detail: { engineRuleId },
  });
  refreshHealthCounters();
  return { ok: true, rule: toPublish, engineRuleId };
}

export function disableRule(params: {
  governedRuleId: string;
  actor: ActorContext;
}): { ok: true; rule: GovernedRule } | { ok: false; error: string } {
  const rule = getGovernedRule(params.governedRuleId);
  if (!rule || rule.softDeleted) return { ok: false, error: "Not found" };
  const transition = LifecycleManager.assert(
    rule.lifecycle,
    "disabled",
    params.actor.role,
  );
  if (!transition.ok) return transition;
  if (rule.engineRuleId) {
    AutomationService.enableRule(rule.engineRuleId, false);
  }
  const updated: GovernedRule = {
    ...rule,
    lifecycle: "disabled",
    updatedAt: new Date().toISOString(),
  };
  saveGovernedRule(updated);
  AuditService.record({
    governedRuleId: rule.id,
    type: "disabled",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber: rule.activeVersionNumber,
    message: "Rule disabled",
  });
  refreshHealthCounters();
  return { ok: true, rule: updated };
}

export function archiveRule(params: {
  governedRuleId: string;
  actor: ActorContext;
}): { ok: true; rule: GovernedRule } | { ok: false; error: string } {
  const rule = getGovernedRule(params.governedRuleId);
  if (!rule || rule.softDeleted) return { ok: false, error: "Not found" };
  const transition = LifecycleManager.assert(
    rule.lifecycle,
    "archived",
    params.actor.role,
  );
  if (!transition.ok) return transition;
  if (rule.engineRuleId) {
    AutomationService.enableRule(rule.engineRuleId, false);
  }
  const updated: GovernedRule = {
    ...rule,
    lifecycle: "archived",
    updatedAt: new Date().toISOString(),
  };
  saveGovernedRule(updated);
  AuditService.record({
    governedRuleId: rule.id,
    type: "archived",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber: rule.activeVersionNumber,
    message: "Rule archived",
  });
  refreshHealthCounters();
  return { ok: true, rule: updated };
}

export function softDeleteRule(params: {
  governedRuleId: string;
  actor: ActorContext;
}): { ok: true } | { ok: false; error: string } {
  if (params.actor.role !== "administrator") {
    return { ok: false, error: "Only administrators can soft-delete" };
  }
  const rule = getGovernedRule(params.governedRuleId);
  if (!rule) return { ok: false, error: "Not found" };
  if (rule.engineRuleId) {
    AutomationService.enableRule(rule.engineRuleId, false);
  }
  saveGovernedRule({
    ...rule,
    softDeleted: true,
    lifecycle: "archived",
    updatedAt: new Date().toISOString(),
  });
  AuditService.record({
    governedRuleId: rule.id,
    type: "deleted",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    message: "Soft-deleted governed rule",
  });
  refreshHealthCounters();
  return { ok: true };
}

export function rollbackRule(params: {
  governedRuleId: string;
  targetVersion: number;
  actor: ActorContext;
}):
  | { ok: true; rule: GovernedRule; engineRuleId: string }
  | { ok: false; error: string } {
  if (!isAutomationGovernanceEnabled()) {
    return { ok: false, error: "AUTOMATION_GOVERNANCE disabled" };
  }
  if (params.actor.role !== "approver" && params.actor.role !== "administrator") {
    return { ok: false, error: "Rollback requires approver or administrator" };
  }
  const plan = RollbackService.plan({
    governedRuleId: params.governedRuleId,
    targetVersion: params.targetVersion,
  });
  if (!plan.ok || !plan.content) {
    return { ok: false, error: plan.error ?? "Rollback failed" };
  }
  const rule = getGovernedRule(params.governedRuleId)!;
  const restored = RollbackService.applyContent(
    rule,
    plan.content,
    params.targetVersion,
  );
  const engineRuleId = syncEngineRule(restored, true);
  if (!engineRuleId) {
    return { ok: false, error: "Failed to sync engine after rollback" };
  }
  restored.engineRuleId = engineRuleId;
  VersionManager.markPublished(rule.id, params.targetVersion);
  saveGovernedRule(restored);
  RollbackService.recordTelemetry();
  AuditService.record({
    governedRuleId: rule.id,
    type: "rolled_back",
    actorId: params.actor.actorId,
    actorRole: params.actor.role,
    versionNumber: params.targetVersion,
    message: `Rolled back ${plan.fromVersion} → ${params.targetVersion}`,
    detail: { fromVersion: plan.fromVersion, toVersion: params.targetVersion },
  });
  refreshHealthCounters();
  return { ok: true, rule: restored, engineRuleId };
}

export function reviewChanges(params: {
  governedRuleId: string;
  fromVersion: number;
  toVersion: number;
}): ChangeReviewDiff | null {
  return VersionManager.compareNumbers(
    params.governedRuleId,
    params.fromVersion,
    params.toVersion,
  );
}

export function configurePolicy(
  policy: GovernancePolicy,
  actor: ActorContext,
): { ok: true; policy: GovernancePolicy } | { ok: false; error: string } {
  if (actor.role !== "administrator") {
    return { ok: false, error: "Only administrators can configure policy" };
  }
  return { ok: true, policy: setPolicy(policy) };
}

export function getGovernanceHealth() {
  refreshHealthCounters();
  const telemetry = getGovernanceTelemetrySnapshot();
  return {
    governanceEnabled: isAutomationGovernanceEnabled(),
    approvalsEnabled: isAutomationApprovalsEnabled(),
    auditEnabled: isAutomationAuditEnabled(),
    modelVersion: AUTOMATION_GOVERNANCE_MODEL_VERSION,
    ...telemetry,
  };
}

export function contentFromEngineTrigger(params: {
  name: string;
  trigger: AutomationTriggerType;
  actions: RuleContentSnapshot["actions"];
  conditions?: RuleContentSnapshot["conditions"];
  description?: string;
  permissions?: string[];
}): RuleContentSnapshot {
  return {
    name: params.name,
    description: params.description ?? "",
    trigger: params.trigger,
    conditions: params.conditions ?? null,
    actions: params.actions,
    dryRun: false,
    priority: 100,
    permissions: params.permissions ?? ["analytics.admin"],
  };
}

export const GovernanceService = {
  create: createGovernedRule,
  edit: editGovernedRule,
  submitForReview,
  approve: approveRule,
  publish: publishRule,
  disable: disableRule,
  archive: archiveRule,
  softDelete: softDeleteRule,
  rollback: rollbackRule,
  markSimulationComplete,
  reviewChanges,
  configurePolicy,
  getPolicy,
  list: listGovernedRules,
  get: getGovernedRule,
  versions: listVersions,
  audit: AuditService.history,
  health: getGovernanceHealth,
  contentFrom: contentFromEngineTrigger,
};
