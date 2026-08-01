/**
 * VersionManager — immutable versions + comparison.
 */

import {
  allocateGovernedIds,
  getVersion,
  listVersions,
  saveVersion,
} from "@/lib/automation/governance/store";
import type {
  ChangeReviewDiff,
  GovernedRuleVersion,
  RuleContentSnapshot,
} from "@/lib/automation/governance/types";

export function createImmutableVersion(params: {
  governedRuleId: string;
  versionNumber: number;
  content: RuleContentSnapshot;
  createdBy: string;
  note?: string | null;
}): GovernedRuleVersion {
  const version: GovernedRuleVersion = {
    id: allocateGovernedIds().versionId,
    versionNumber: params.versionNumber,
    content: structuredClone(params.content),
    createdAt: new Date().toISOString(),
    createdBy: params.createdBy,
    publishedAt: null,
    note: params.note ?? null,
  };
  saveVersion(params.governedRuleId, version);
  return version;
}

export function markVersionPublished(
  governedRuleId: string,
  versionNumber: number,
): GovernedRuleVersion | null {
  const version = getVersion(governedRuleId, versionNumber);
  if (!version) return null;
  version.publishedAt = new Date().toISOString();
  return version;
}

export function history(governedRuleId: string): GovernedRuleVersion[] {
  return listVersions(governedRuleId);
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

export function compareVersions(
  a: RuleContentSnapshot | null,
  b: RuleContentSnapshot | null,
): ChangeReviewDiff {
  const summary: string[] = [];
  const conditionChanges: string[] = [];
  const actionChanges: string[] = [];
  const permissionImpact: string[] = [];
  const riskIndicators: string[] = [];

  if (!a && b) {
    summary.push("Initial version");
  } else if (a && b) {
    if (a.name !== b.name) summary.push(`Name: "${a.name}" → "${b.name}"`);
    if (a.description !== b.description) summary.push("Description changed");
    if (a.priority !== b.priority) {
      summary.push(`Priority: ${a.priority} → ${b.priority}`);
    }
    if (a.dryRun !== b.dryRun) {
      summary.push(`Dry-run: ${a.dryRun} → ${b.dryRun}`);
      if (!b.dryRun) riskIndicators.push("Dry-run disabled — live actions");
    }
  }

  const triggerChanged = (a?.trigger ?? null) !== (b?.trigger ?? null);
  if (triggerChanged) {
    summary.push(`Trigger: ${a?.trigger ?? "∅"} → ${b?.trigger ?? "∅"}`);
    riskIndicators.push("Trigger changed — different event surface");
  }

  if (stableJson(a?.conditions ?? null) !== stableJson(b?.conditions ?? null)) {
    conditionChanges.push("Condition tree changed");
    summary.push("Conditions changed");
  }

  const aActions = a?.actions ?? [];
  const bActions = b?.actions ?? [];
  if (stableJson(aActions) !== stableJson(bActions)) {
    actionChanges.push(
      `Actions ${aActions.length} → ${bActions.length}`,
    );
    const aTypes = new Set(aActions.map((x) => x.type));
    const bTypes = new Set(bActions.map((x) => x.type));
    for (const t of bTypes) {
      if (!aTypes.has(t)) {
        actionChanges.push(`Added action: ${t}`);
        if (t === "escalate_operations" || t === "recalculate_trust") {
          riskIndicators.push(`High-impact action added: ${t}`);
        }
      }
    }
    for (const t of aTypes) {
      if (!bTypes.has(t)) actionChanges.push(`Removed action: ${t}`);
    }
    summary.push("Actions changed");
  }

  const aPerms = new Set(a?.permissions ?? []);
  const bPerms = new Set(b?.permissions ?? []);
  for (const p of bPerms) {
    if (!aPerms.has(p)) permissionImpact.push(`+${p}`);
  }
  for (const p of aPerms) {
    if (!bPerms.has(p)) permissionImpact.push(`-${p}`);
  }
  if (permissionImpact.length) summary.push("Permissions changed");

  if (bActions.length > 5) {
    riskIndicators.push("High action count");
  }

  return {
    summary: summary.length ? summary : ["No material changes"],
    triggerChanged,
    triggerFrom: a?.trigger ?? null,
    triggerTo: b?.trigger ?? null,
    conditionChanges,
    actionChanges,
    permissionImpact,
    riskIndicators,
  };
}

export function compareVersionNumbers(
  governedRuleId: string,
  fromVersion: number,
  toVersion: number,
): ChangeReviewDiff | null {
  const from = getVersion(governedRuleId, fromVersion);
  const to = getVersion(governedRuleId, toVersion);
  if (!from || !to) return null;
  return compareVersions(from.content, to.content);
}

export const VersionManager = {
  create: createImmutableVersion,
  markPublished: markVersionPublished,
  history,
  get: getVersion,
  compare: compareVersions,
  compareNumbers: compareVersionNumbers,
};
