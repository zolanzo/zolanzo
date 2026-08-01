/**
 * ConditionBuilder — helpers for nested AND/OR condition trees.
 */

import {
  CONDITION_OPERATORS,
  type ConditionAtom,
  type ConditionGroup,
  type ConditionOperator,
} from "@/lib/automation/types";

export function createEmptyGroup(logic: "and" | "or" = "and"): ConditionGroup {
  return { logic, conditions: [] };
}

export function createAtom(
  field: string,
  op: ConditionOperator,
  value?: unknown,
): ConditionAtom {
  return { field, op, value };
}

export function addCondition(
  group: ConditionGroup,
  node: ConditionAtom | ConditionGroup,
): ConditionGroup {
  return { ...group, conditions: [...group.conditions, node] };
}

export function nestGroup(
  parent: ConditionGroup,
  child: ConditionGroup,
): ConditionGroup {
  return addCondition(parent, child);
}

export function setGroupLogic(
  group: ConditionGroup,
  logic: "and" | "or",
): ConditionGroup {
  return { ...group, logic };
}

export function isValidOperator(op: string): op is ConditionOperator {
  return (CONDITION_OPERATORS as readonly string[]).includes(op);
}

export function summarizeConditionTree(
  group: ConditionGroup | null,
  depth = 0,
): string[] {
  if (!group || group.conditions.length === 0) {
    return depth === 0 ? ["(no conditions — always match)"] : [];
  }
  const lines: string[] = [];
  const indent = "  ".repeat(depth);
  lines.push(`${indent}${group.logic.toUpperCase()} group`);
  for (const node of group.conditions) {
    if ("logic" in node && (node.logic === "and" || node.logic === "or")) {
      lines.push(...summarizeConditionTree(node, depth + 1));
    } else {
      const atom = node as ConditionAtom;
      const value =
        atom.value === undefined ? "" : ` ${JSON.stringify(atom.value)}`;
      lines.push(`${indent}  ${atom.field} ${atom.op}${value}`);
    }
  }
  return lines;
}

/** Structural walk for validators */
export function walkConditions(
  group: ConditionGroup | null,
  visit: (atom: ConditionAtom, path: string) => void,
  path = "conditions",
): void {
  if (!group) return;
  group.conditions.forEach((node, i) => {
    const childPath = `${path}[${i}]`;
    if ("logic" in node && (node.logic === "and" || node.logic === "or")) {
      walkConditions(node, visit, childPath);
    } else {
      visit(node as ConditionAtom, childPath);
    }
  });
}

export const ConditionBuilder = {
  empty: createEmptyGroup,
  atom: createAtom,
  add: addCondition,
  nest: nestGroup,
  setLogic: setGroupLogic,
  isValidOperator,
  summarize: summarizeConditionTree,
  walk: walkConditions,
  operators: CONDITION_OPERATORS,
};
