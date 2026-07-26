/**
 * Auto-generate Submission Summary from assignment + manifest.
 */

import type { ManifestEvidenceKind } from "@/constants/work-states";
import type { SubmissionSummaryRecord } from "@/features/submissions/types";

export type SummaryInput = {
  startedAt: string | null;
  submittedAt: string;
  completedSteps: number;
  requiredSteps: number;
  requiredCompleted: number;
  progressPercent: number;
  evidenceKinds: readonly ManifestEvidenceKind[];
  workerNotes: readonly string[];
  executionContextKeys: readonly string[];
};

export type GeneratedSummary = Omit<
  SubmissionSummaryRecord,
  "id" | "submissionId" | "generatedAt"
>;

export function generateSubmissionSummary(
  input: SummaryInput,
): GeneratedSummary {
  const timeSpentSeconds =
    input.startedAt != null
      ? Math.max(
          0,
          Math.floor(
            (new Date(input.submittedAt).getTime() -
              new Date(input.startedAt).getTime()) /
              1000,
          ),
        )
      : null;

  const evidenceCounts: Record<string, number> = {};
  for (const kind of input.evidenceKinds) {
    evidenceCounts[kind] = (evidenceCounts[kind] ?? 0) + 1;
  }

  return {
    timeSpentSeconds,
    completedSteps: input.completedSteps,
    requiredSteps: input.requiredSteps,
    requiredCompleted: input.requiredCompleted,
    evidenceCounts,
    executionMetrics: {
      progressPercent: input.progressPercent,
      evidenceItemCount: input.evidenceKinds.length,
      contextKeys: [...input.executionContextKeys],
    },
    workerNotesSummary:
      input.workerNotes.length > 0
        ? input.workerNotes.map((n) => n.trim()).filter(Boolean).join("\n---\n")
        : null,
  };
}

export function countEvidenceByKind(
  kinds: readonly ManifestEvidenceKind[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const kind of kinds) {
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  return counts;
}
