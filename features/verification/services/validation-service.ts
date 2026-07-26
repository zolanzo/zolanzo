/**
 * Validation Engine service — runs pipeline against Submission Packages.
 */

import "server-only";

import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  VALIDATION_PROFILE_KEYS,
  type ValidationProfileKey,
} from "@/constants/work-states";
import { getValidationProfile } from "@/constants/validation-profiles";
import { assertAssignmentTransition } from "@/features/assignments/services/lifecycle";
import { assignmentRepository } from "@/features/assignments/repositories";
import { assertSubmissionTransition } from "@/features/submissions/services/lifecycle";
import { submissionRepository } from "@/features/submissions/repositories";
import { captureEvidenceSnapshot } from "@/features/verification/services/evidence-snapshot";
import { runValidationPipeline } from "@/features/verification/services/pipeline";
import { validationRepository } from "@/features/verification/repositories";
import {
  getValidationReportSchema,
  listValidationReportsSchema,
  runValidationSchema,
} from "@/features/verification/validators";
import type {
  ValidationReportPackage,
  ValidationReportRecord,
} from "@/features/verification/types";

function resolveProfileKey(
  explicit: ValidationProfileKey | undefined,
  metadata: Record<string, unknown> | null,
): ValidationProfileKey {
  if (explicit) return explicit;
  const fromMeta = metadata?.validationProfileKey;
  if (
    typeof fromMeta === "string" &&
    (VALIDATION_PROFILE_KEYS as readonly string[]).includes(fromMeta)
  ) {
    return fromMeta as ValidationProfileKey;
  }
  return "app_testing";
}

export async function runValidation(params: {
  input: unknown;
}): Promise<ApiResponse<ValidationReportPackage>> {
  try {
    const parsed = runValidationSchema.parse(params.input);
    const submission = await submissionRepository.findByPublicId(
      parsed.submissionPublicId,
    );
    if (!submission) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }

    if (submission.status !== "submitted" && submission.status !== "validating") {
      throw new AppError(
        "INVALID_STATUS",
        `Submission must be submitted or validating (got ${submission.status})`,
        400,
      );
    }

    const pkg = await submissionRepository.getPackage(submission.id);
    if (!pkg) {
      throw new AppError("PACKAGE_INCOMPLETE", "Submission package incomplete", 500);
    }

    if (submission.status === "submitted") {
      assertSubmissionTransition(submission.status, "validating");
      await submissionRepository.setStatus({
        id: submission.id,
        status: "validating",
      });
    }

    const assignment = await assignmentRepository.findById(submission.assignmentId);
    if (assignment && assignment.status === "submitted") {
      assertAssignmentTransition(assignment.status, "under_validation");
      await assignmentRepository.updateStatus({
        id: assignment.id,
        status: "under_validation",
      });
    }

    const profileKey = resolveProfileKey(
      parsed.profileKey,
      submission.metadata,
    );
    const profile = getValidationProfile(profileKey);
    const evidenceSnapshot = captureEvidenceSnapshot(pkg.items);

    const aggregated = await runValidationPipeline({
      submission: pkg.submission,
      manifest: pkg.manifest,
      summary: pkg.summary,
      evidenceSnapshot,
      executionContext: pkg.submission.executionContextSnapshot,
      profile,
    });

    const publicId = await generatePublicId("validation_report");
    const profileId = await validationRepository.findProfileIdByKey(profileKey);

    const reportPkg = await validationRepository.createReport({
      publicId,
      submissionId: submission.id,
      profileKey,
      profileId,
      profileSnapshot: profile,
      aggregated,
      evidenceItems: evidenceSnapshot,
    });

    assertSubmissionTransition("validating", "validation_complete");
    await submissionRepository.setStatus({
      id: submission.id,
      status: "validation_complete",
    });

    // Continuous pipeline: enqueue review (policy may auto-decide)
    const { enqueueForReview } = await import(
      "@/features/verification/services/review-service"
    );
    await enqueueForReview({
      input: {
        submissionPublicId: submission.publicId,
        validationReportPublicId: reportPkg.report.publicId,
      },
    });

    return apiSuccess(reportPkg);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "VALIDATION_FAILED",
      error instanceof Error ? error.message : "Validation pipeline failed",
    );
  }
}

export async function getValidationReport(params: {
  input: unknown;
}): Promise<ApiResponse<ValidationReportPackage>> {
  try {
    const parsed = getValidationReportSchema.parse(params.input);
    const report = await validationRepository.findReportByPublicId(
      parsed.reportPublicId,
    );
    if (!report) {
      throw new AppError("NOT_FOUND", "Validation report not found", 404);
    }
    const pkg = await validationRepository.getReportPackage(report.id);
    if (!pkg) {
      throw new AppError("REPORT_INCOMPLETE", "Report incomplete", 500);
    }
    return apiSuccess(pkg);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "GET_FAILED",
      error instanceof Error ? error.message : "Could not load report",
    );
  }
}

export async function listValidationReports(params: {
  input: unknown;
}): Promise<ApiResponse<ValidationReportRecord[]>> {
  try {
    const parsed = listValidationReportsSchema.parse(params.input);
    const submission = await submissionRepository.findByPublicId(
      parsed.submissionPublicId,
    );
    if (!submission) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }
    const reports = await validationRepository.listReportsForSubmission(
      submission.id,
    );
    return apiSuccess(reports);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "LIST_FAILED",
      error instanceof Error ? error.message : "Could not list reports",
    );
  }
}
