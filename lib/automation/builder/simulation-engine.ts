/**
 * SimulationEngine — dry-run only. Never executes domain actions.
 */

import { evaluateAtom, evaluateConditionGroup } from "@/lib/automation/condition-evaluator";
import type { ConditionAtom, ConditionGroup } from "@/lib/automation/types";
import { validateRuleDraft } from "@/lib/automation/builder/rule-validator";
import { getActionCatalogEntry } from "@/lib/automation/builder/action-builder";
import { samplePayloadForTrigger } from "@/lib/automation/builder/trigger-picker";
import { recordBuilderSimulation } from "@/lib/automation/builder/telemetry";
import { isAutomationSimulationEnabled } from "@/lib/automation/builder/config";
import type {
  SimulationInput,
  SimulationResult,
} from "@/lib/automation/builder/types";

function detailConditions(
  group: ConditionGroup | null,
  payload: Record<string, unknown>,
  path = "conditions",
): Array<{ path: string; matched: boolean; detail: string }> {
  if (!group) {
    return [
      {
        path,
        matched: true,
        detail: "No conditions — always match",
      },
    ];
  }
  const rows: Array<{ path: string; matched: boolean; detail: string }> = [];
  group.conditions.forEach((node, i) => {
    const childPath = `${path}[${i}]`;
    if ("logic" in node && (node.logic === "and" || node.logic === "or")) {
      const nested = detailConditions(node, payload, childPath);
      rows.push(...nested);
      const matched = evaluateConditionGroup(node, payload);
      rows.push({
        path: childPath,
        matched,
        detail: `${node.logic.toUpperCase()} group => ${matched}`,
      });
    } else {
      const atom = node as ConditionAtom;
      const matched = evaluateAtom(atom, payload);
      rows.push({
        path: childPath,
        matched,
        detail: `${atom.field} ${atom.op} ${JSON.stringify(atom.value)} => ${matched}`,
      });
    }
  });
  return rows;
}

export function simulateRule(input: SimulationInput): SimulationResult {
  const validation = validateRuleDraft(input.draft, { forSimulation: true });
  if (!isAutomationSimulationEnabled()) {
    return {
      ok: false,
      conditionsMatched: false,
      conditionDetails: [],
      actionsWouldExecute: [],
      warnings: ["AUTOMATION_SIMULATION disabled"],
      estimatedLatencyMs: 0,
      dryRun: true,
      validation,
    };
  }

  recordBuilderSimulation();

  const payload =
    input.samplePayload ??
    (input.draft.trigger
      ? samplePayloadForTrigger(input.draft.trigger)
      : {});

  const conditionsMatched = evaluateConditionGroup(
    input.draft.conditions,
    payload,
  );
  const conditionDetails = detailConditions(input.draft.conditions, payload);

  const warnings = [
    ...validation.warnings.map((w) => w.message),
    "Simulation is dry-run only — no domain actions executed",
  ];

  const actionsWouldExecute = conditionsMatched
    ? (input.draft.actions ?? []).map((a) => ({
        type: a.type,
        label: getActionCatalogEntry(a.type)?.label ?? a.type,
        params: (a.params ?? {}) as Record<string, unknown>,
      }))
    : [];

  if (!conditionsMatched) {
    warnings.push("Conditions did not match sample payload — actions skipped");
  }

  let estimatedLatencyMs = 5;
  for (const a of input.draft.actions ?? []) {
    const entry = getActionCatalogEntry(a.type);
    estimatedLatencyMs += entry ? Math.min(entry.timeoutMs / 20, 80) : 10;
    estimatedLatencyMs += (entry?.estimatedCost ?? 1) * 8;
  }

  return {
    ok: validation.ok,
    conditionsMatched,
    conditionDetails,
    actionsWouldExecute,
    warnings,
    estimatedLatencyMs: Math.round(estimatedLatencyMs),
    dryRun: true,
    validation,
  };
}

export const SimulationEngine = {
  simulate: simulateRule,
};
