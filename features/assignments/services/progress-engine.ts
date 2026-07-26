/**
 * Progress calculations for assignment workspaces.
 */

import type { AssignmentStepStatus } from "@/constants/work-states";
import type { AssignmentProgress } from "@/features/assignments/types";

export type ProgressStepInput = {
  required: boolean;
  status: AssignmentStepStatus;
  estimatedDurationMin: number | null;
};

export function calculateAssignmentProgress(params: {
  steps: readonly ProgressStepInput[];
  startedAt: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
}): AssignmentProgress {
  const totalSteps = params.steps.length;
  const requiredSteps = params.steps.filter((s) => s.required).length;
  const completedSteps = params.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped",
  ).length;
  const requiredCompleted = params.steps.filter(
    (s) => s.required && (s.status === "completed" || s.status === "skipped"),
  ).length;
  const optionalCompleted = params.steps.filter(
    (s) => !s.required && (s.status === "completed" || s.status === "skipped"),
  ).length;

  const progressPercent =
    totalSteps === 0
      ? 0
      : Math.min(100, Math.round((completedSteps / totalSteps) * 100));

  const remaining = params.steps.filter(
    (s) =>
      s.status === "pending" ||
      s.status === "in_progress" ||
      s.status === "failed",
  );
  const estimatedRemainingMin = remaining.reduce((sum, step) => {
    return sum + (step.estimatedDurationMin ?? 0);
  }, 0);

  const readyForSubmission =
    requiredSteps === 0
      ? totalSteps > 0 && completedSteps === totalSteps
      : requiredCompleted === requiredSteps;

  return {
    progressPercent,
    completedSteps,
    requiredSteps,
    requiredCompleted,
    optionalCompleted,
    totalSteps,
    estimatedRemainingMin:
      estimatedRemainingMin > 0 ? estimatedRemainingMin : null,
    startedAt: params.startedAt,
    lastActivityAt: params.lastActivityAt,
    completedAt: params.completedAt,
    readyForSubmission,
  };
}
