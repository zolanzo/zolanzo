/**
 * Reviewer Workspace — aggregates context for decision-making.
 */

import "server-only";

import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { assignmentRepository } from "@/features/assignments/repositories";
import { submissionRepository } from "@/features/submissions/repositories";
import { validationRepository } from "@/features/verification/repositories";
import { reviewRepository } from "@/features/verification/repositories/review-repository";
import { getWorkspaceSchema } from "@/features/verification/validators/review";
import type { ReviewerWorkspace } from "@/features/verification/types/review";

export async function getReviewerWorkspace(params: {
  input: unknown;
}): Promise<ApiResponse<ReviewerWorkspace>> {
  try {
    const parsed = getWorkspaceSchema.parse(params.input);
    const queueItem = await reviewRepository.findQueueItemById(parsed.queueItemId);
    if (!queueItem) {
      throw new AppError("NOT_FOUND", "Queue item not found", 404);
    }

    const submissionPkg = await submissionRepository.getPackage(
      queueItem.submissionId,
    );
    if (!submissionPkg) {
      throw new AppError("PACKAGE_INCOMPLETE", "Submission package incomplete", 500);
    }

    const validationReport = await validationRepository.getReportPackage(
      queueItem.validationReportId,
    );
    if (!validationReport) {
      throw new AppError("REPORT_INCOMPLETE", "Validation report incomplete", 500);
    }

    const assignment = await assignmentRepository.findById(
      submissionPkg.submission.assignmentId,
    );
    if (!assignment) {
      throw new AppError("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
    }

    const timeline = await assignmentRepository.listTimeline(assignment.id);
    const priorDecisions = await reviewRepository.listDecisionsForSubmission(
      queueItem.submissionId,
    );
    const priorFindings = await reviewRepository.listFindingsForSubmission(
      queueItem.submissionId,
    );

    return apiSuccess({
      queueItem,
      submission: submissionPkg,
      validationReport,
      evidenceSnapshot: validationReport.evidenceSnapshot.items,
      assignment,
      timeline,
      summary: submissionPkg.summary,
      priorFindings,
      priorDecisions,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "WORKSPACE_FAILED",
      error instanceof Error ? error.message : "Could not load reviewer workspace",
    );
  }
}
