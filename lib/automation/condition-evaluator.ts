/**
 * ConditionEvaluator — composable AND/OR condition trees.
 */

import type {
  ConditionAtom,
  ConditionGroup,
} from "@/lib/automation/types";

function getPath(
  ctx: Record<string, unknown>,
  field: string,
): unknown {
  const parts = field.split(".");
  let cur: unknown = ctx;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function compare(op: ConditionAtom["op"], left: unknown, right: unknown): boolean {
  switch (op) {
    case "exists":
      return left !== undefined && left !== null;
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    case "gt":
      return typeof left === "number" && typeof right === "number" && left > right;
    case "gte":
      return typeof left === "number" && typeof right === "number" && left >= right;
    case "lt":
      return typeof left === "number" && typeof right === "number" && left < right;
    case "lte":
      return typeof left === "number" && typeof right === "number" && left <= right;
    case "in":
      return Array.isArray(right) && right.includes(left);
    case "contains":
      if (typeof left === "string" && typeof right === "string") {
        return left.includes(right);
      }
      if (Array.isArray(left)) return left.includes(right);
      return false;
    default:
      return false;
  }
}

export function evaluateAtom(
  atom: ConditionAtom,
  context: Record<string, unknown>,
): boolean {
  const left = getPath(context, atom.field);
  return compare(atom.op, left, atom.value);
}

export function evaluateConditionGroup(
  group: ConditionGroup | null | undefined,
  context: Record<string, unknown>,
): boolean {
  if (!group || group.conditions.length === 0) return true;
  if (group.logic === "and") {
    return group.conditions.every((c) =>
      "logic" in c
        ? evaluateConditionGroup(c, context)
        : evaluateAtom(c, context),
    );
  }
  return group.conditions.some((c) =>
    "logic" in c
      ? evaluateConditionGroup(c, context)
      : evaluateAtom(c, context),
  );
}

export const ConditionEvaluator = {
  evaluate: evaluateConditionGroup,
  evaluateAtom,
};
