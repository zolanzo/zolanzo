/**
 * RulePreview — human-readable preview before save.
 */

import { getTemplate } from "@/lib/automation/library/template-registry";
import { summarizeConditionTree } from "@/lib/automation/builder/condition-builder";
import { getActionCatalogEntry } from "@/lib/automation/builder/action-builder";
import { getTriggerCatalogEntry } from "@/lib/automation/builder/trigger-picker";
import type {
  RuleDraft,
  RulePreviewModel,
} from "@/lib/automation/builder/types";

export function buildRulePreview(draft: RuleDraft): RulePreviewModel {
  const triggerEntry = draft.trigger
    ? getTriggerCatalogEntry(draft.trigger)
    : undefined;

  let matchingTemplateId: string | null = draft.sourceTemplateId ?? null;
  let matchingTemplateName: string | null = null;

  if (matchingTemplateId) {
    const t = getTemplate(matchingTemplateId);
    matchingTemplateName = t?.name ?? null;
  } else if (draft.trigger) {
    const compatible = triggerEntry?.compatibleTemplateIds?.[0];
    if (compatible) {
      matchingTemplateId = compatible;
      matchingTemplateName = getTemplate(compatible)?.name ?? null;
    }
  }

  const actions = (draft.actions ?? []).map((a) => {
    const entry = getActionCatalogEntry(a.type);
    return {
      type: a.type,
      label: entry?.label ?? a.type,
      params: (a.params ?? {}) as Record<string, unknown>,
      estimatedCost: entry?.estimatedCost ?? 1,
    };
  });

  const permissions = new Set<string>([
    ...(triggerEntry?.requiredPermissions ?? []),
    ...(draft.permissions ?? []),
  ]);
  for (const a of draft.actions ?? []) {
    const entry = getActionCatalogEntry(a.type);
    for (const p of entry?.permissions ?? []) permissions.add(p);
  }

  const flow: string[] = [];
  flow.push(
    draft.trigger
      ? `1. On ${triggerEntry?.name ?? draft.trigger}`
      : "1. (no trigger selected)",
  );
  flow.push(
    draft.conditions
      ? "2. Evaluate condition tree"
      : "2. No conditions (always match)",
  );
  if (matchingTemplateId) {
    flow.push(
      `3. Related template: ${matchingTemplateName ?? matchingTemplateId}`,
    );
  }
  const actionStep = matchingTemplateId ? 4 : 3;
  if (actions.length === 0) {
    flow.push(`${actionStep}. (no actions)`);
  } else {
    actions.forEach((a, i) => {
      flow.push(
        `${actionStep + i}. Would invoke ${a.label} (cost ${a.estimatedCost})`,
      );
    });
  }
  flow.push(
    `${actionStep + Math.max(actions.length, 1)}. Persist via AutomationService.createRule()`,
  );

  return {
    trigger: draft.trigger,
    triggerDescription: triggerEntry?.description ?? null,
    conditionsSummary: summarizeConditionTree(draft.conditions),
    matchingTemplateId,
    matchingTemplateName,
    actions,
    permissionsRequired: [...permissions],
    estimatedExecutionFlow: flow,
    dryRun: draft.dryRun ?? false,
  };
}

export const RulePreview = {
  build: buildRulePreview,
};
