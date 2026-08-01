/**
 * ApprovalEngine — configurable approval before publish.
 */

import { isAutomationApprovalsEnabled } from "@/lib/automation/governance/config";
import {
  allocateGovernedIds,
  getPolicy,
  listApprovals,
  saveApproval,
} from "@/lib/automation/governance/store";
import { bumpGovernanceCounter } from "@/lib/automation/governance/telemetry";
import type {
  ApprovalRequest,
  GovernanceRole,
} from "@/lib/automation/governance/types";

const DECIDER_ROLES: GovernanceRole[] = ["approver", "administrator"];

export function requestApproval(params: {
  governedRuleId: string;
  versionNumber: number;
  requestedBy: string;
}): ApprovalRequest | { error: string } {
  if (!isAutomationApprovalsEnabled()) {
    return { error: "AUTOMATION_APPROVALS disabled" };
  }
  const existing = listApprovals({
    governedRuleId: params.governedRuleId,
    status: "pending",
  });
  if (existing.length) {
    return existing[0]!;
  }
  const req: ApprovalRequest = {
    id: allocateGovernedIds().approvalId,
    governedRuleId: params.governedRuleId,
    versionNumber: params.versionNumber,
    status: "pending",
    requestedBy: params.requestedBy,
    requestedAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    comment: null,
  };
  saveApproval(req);
  bumpGovernanceCounter("pendingApprovals");
  return req;
}

export function decideApproval(params: {
  approvalId: string;
  decide: "approved" | "rejected";
  decidedBy: string;
  role: GovernanceRole;
  comment?: string;
}): ApprovalRequest | { error: string } {
  if (!isAutomationApprovalsEnabled()) {
    return { error: "AUTOMATION_APPROVALS disabled" };
  }
  if (!DECIDER_ROLES.includes(params.role)) {
    return { error: `Role ${params.role} cannot decide approvals` };
  }
  const rows = listApprovals();
  const req = rows.find((a) => a.id === params.approvalId);
  if (!req) return { error: "Approval not found" };
  if (req.status !== "pending") {
    return { error: `Approval already ${req.status}` };
  }
  req.status = params.decide;
  req.decidedBy = params.decidedBy;
  req.decidedAt = new Date().toISOString();
  req.comment = params.comment ?? null;
  saveApproval(req);
  if (params.decide === "approved") {
    bumpGovernanceCounter("pendingApprovals", -1);
  } else {
    bumpGovernanceCounter("pendingApprovals", -1);
  }
  return req;
}

export function hasSufficientApprovals(
  governedRuleId: string,
  organizationId?: string | null,
): boolean {
  const policy = getPolicy(organizationId);
  if (!policy.approvalRequired || !isAutomationApprovalsEnabled()) return true;
  const approved = listApprovals({
    governedRuleId,
    status: "approved",
  });
  return approved.length >= policy.minApprovals;
}

export const ApprovalEngine = {
  request: requestApproval,
  decide: decideApproval,
  list: listApprovals,
  hasSufficient: hasSufficientApprovals,
};
