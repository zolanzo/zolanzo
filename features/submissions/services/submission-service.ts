import "server-only";

import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import { getEvidenceStorageAdapter } from "@/lib/integrations/evidence";
import type { EvidenceReference } from "@/lib/integrations/types";
import type { ManifestEvidenceKind } from "@/constants/work-states";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";
import { assignmentRepository } from "@/features/assignments/repositories";
import { calculateAssignmentProgress } from "@/features/assignments/services/progress-engine";
import { assertAssignmentTransition, canTransitionAssignment } from "@/features/assignments/services/lifecycle";
import { submissionRepository } from "@/features/submissions/repositories";
import {
  assertSubmissionTransition,
  isEvidenceMutable,
} from "@/features/submissions/services/lifecycle";
import { generateSubmissionSummary } from "@/features/submissions/services/summary-engine";
import { hashBytes, hashText } from "@/features/submissions/services/evidence-hash";
import {
  attachEvidenceSchema,
  createDraftSubmissionSchema,
  markSubmissionReadySchema,
  removeEvidenceSchema,
  replaceEvidenceSchema,
  submitPackageSchema,
} from "@/features/submissions/validators";
import type {
  EvidenceItemRecord,
  SubmissionPackage,
} from "@/features/submissions/types";
import { assertSubmissionAccess } from "@/lib/auth/resource-guards";

const INLINE_KINDS = new Set<ManifestEvidenceKind>([
  "text",
  "json",
  "gps",
  "link",
]);

function decodeBase64(bodyBase64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(bodyBase64, "base64"));
}

async function loadMutablePackage(params: {
  publicId: string;
  workerUserId: string;
}): Promise<SubmissionPackage> {
  const submission = await submissionRepository.findByPublicId(params.publicId);
  if (!submission) {
    throw new AppError("NOT_FOUND", "Submission not found", 404);
  }
  assertSubmissionAccess({
    workerUserId: submission.workerUserId,
    actorUserId: params.workerUserId,
  });
  if (!isEvidenceMutable(submission.status)) {
    throw new AppError(
      "IMMUTABLE",
      "Evidence can only change in draft or ready state",
      409,
    );
  }
  const pkg = await submissionRepository.getPackage(submission.id);
  if (!pkg) {
    throw new AppError("PACKAGE_INCOMPLETE", "Manifest missing", 500);
  }
  if (pkg.manifest.finalized) {
    throw new AppError("MANIFEST_FINALIZED", "Manifest is finalized", 409);
  }
  return pkg;
}

async function buildReference(params: {
  submissionPublicId: string;
  kind: ManifestEvidenceKind;
  label: string;
  bodyBase64?: string;
  contentType?: string;
  inlinePayload?: string | Record<string, unknown>;
}): Promise<{
  reference: EvidenceReference;
  contentHash: string | null;
  sizeBytes: number | null;
  inlinePayload: string | Record<string, unknown> | null;
}> {
  if (INLINE_KINDS.has(params.kind)) {
    if (params.inlinePayload == null) {
      throw new AppError(
        "INLINE_REQUIRED",
        `${params.kind} evidence requires inlinePayload`,
        400,
      );
    }
    const serialized =
      typeof params.inlinePayload === "string"
        ? params.inlinePayload
        : JSON.stringify(params.inlinePayload);
    const contentHash = await hashText(serialized);
    const reference: EvidenceReference = {
      adapter: "memory",
      container: "inline",
      objectKey: `${params.submissionPublicId}/${params.kind}/${contentHash.slice(0, 16)}`,
      contentType: params.contentType ?? "application/json",
    };
    return {
      reference,
      contentHash,
      sizeBytes: new TextEncoder().encode(serialized).byteLength,
      inlinePayload: params.inlinePayload,
    };
  }

  if (!params.bodyBase64) {
    throw new AppError(
      "BODY_REQUIRED",
      `${params.kind} evidence requires bodyBase64`,
      400,
    );
  }

  const bytes = decodeBase64(params.bodyBase64);
  const contentHash = await hashBytes(bytes);
  const { validateUpload } = await import("@/lib/integrations/storage/validation");
  const sizeCheck = validateUpload({
    assetType: "submission_evidence",
    contentType: params.contentType ?? "application/octet-stream",
    sizeBytes: bytes.byteLength,
  });
  if (!sizeCheck.ok) {
    throw new AppError(sizeCheck.code, sizeCheck.message, 400);
  }
  const adapter = getEvidenceStorageAdapter();
  const objectKey = `submissions/${params.submissionPublicId}/${params.kind}/${contentHash}`;
  const reference = await adapter.store({
    container: "submission-evidence",
    objectKey,
    body: bytes,
    contentType: params.contentType ?? "application/octet-stream",
  });

  return {
    reference,
    contentHash,
    sizeBytes: bytes.byteLength,
    inlinePayload: null,
  };
}

export async function createDraftSubmission(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<SubmissionPackage>> {
  try {
    const parsed = createDraftSubmissionSchema.parse(params.input);
    const assignment = await assignmentRepository.findByPublicId(
      parsed.assignmentPublicId,
    );
    if (!assignment) {
      throw new AppError("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
    }
    if (assignment.workerUserId !== params.workerUserId) {
      throw new AppError("FORBIDDEN", "Assignment belongs to another worker", 403);
    }
    if (
      assignment.status !== "ready_for_submission" &&
      assignment.status !== "in_progress" &&
      assignment.status !== "started"
    ) {
      throw new AppError(
        "ASSIGNMENT_NOT_READY",
        `Cannot create submission from status ${assignment.status}`,
        409,
      );
    }

    const existing = await submissionRepository.findOpenDraftForAssignment(
      assignment.id,
    );
    if (existing) {
      const pkg = await submissionRepository.getPackage(existing.id);
      if (pkg) return apiSuccess(pkg);
    }

    if (!assignment.executionContext) {
      throw new AppError(
        "MISSING_CONTEXT",
        "Assignment has no execution context",
        500,
      );
    }

    const publicId = await generatePublicId("submission");
    const pkg = await submissionRepository.createDraft({
      publicId,
      assignmentId: assignment.id,
      workerUserId: params.workerUserId,
      executionContextSnapshot: assignment.executionContext as ExecutionContext,
      deviceSnapshot: parsed.deviceSnapshot ?? null,
      gpsSnapshot: parsed.gpsSnapshot ?? null,
      metadata: parsed.metadata ?? null,
    });

    return apiSuccess(pkg);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CREATE_SUBMISSION_FAILED",
      error instanceof Error ? error.message : "Could not create submission",
    );
  }
}

export async function attachEvidence(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<EvidenceItemRecord>> {
  try {
    const parsed = attachEvidenceSchema.parse(params.input);
    const pkg = await loadMutablePackage({
      publicId: parsed.submissionPublicId,
      workerUserId: params.workerUserId,
    });
    const built = await buildReference({
      submissionPublicId: parsed.submissionPublicId,
      kind: parsed.kind as ManifestEvidenceKind,
      label: parsed.label,
      bodyBase64: parsed.bodyBase64,
      contentType: parsed.contentType,
      inlinePayload: parsed.inlinePayload,
    });

    // Deduplicate by checksum within the same package
    if (built.contentHash) {
      const existing = pkg.items.find(
        (item) =>
          item.contentHash === built.contentHash && item.replacedAt == null,
      );
      if (existing) {
        return apiSuccess(existing);
      }
    }

    const item = await submissionRepository.createEvidenceItem({
      manifestId: pkg.manifest.id,
      kind: parsed.kind as ManifestEvidenceKind,
      label: parsed.label,
      stepKey: parsed.stepKey,
      reference: built.reference,
      contentHash: built.contentHash,
      sizeBytes: built.sizeBytes,
      inlinePayload: built.inlinePayload,
      metadata: parsed.metadata ?? null,
    });
    return apiSuccess(item);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "ATTACH_FAILED",
      error instanceof Error ? error.message : "Could not attach evidence",
    );
  }
}

export async function replaceEvidence(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<EvidenceItemRecord>> {
  try {
    const parsed = replaceEvidenceSchema.parse(params.input);
    const pkg = await loadMutablePackage({
      publicId: parsed.submissionPublicId,
      workerUserId: params.workerUserId,
    });
    const existing = await submissionRepository.findEvidenceItem(
      parsed.evidenceItemId,
    );
    if (!existing || existing.manifestId !== pkg.manifest.id) {
      throw new AppError("EVIDENCE_NOT_FOUND", "Evidence item not found", 404);
    }

    // Best-effort remove prior blob via adapter
    try {
      const adapter = getEvidenceStorageAdapter();
      if (existing.reference.adapter === adapter.providerKey) {
        await adapter.remove(existing.reference);
      }
    } catch {
      // ignore adapter cleanup errors
    }

    const built = await buildReference({
      submissionPublicId: parsed.submissionPublicId,
      kind: parsed.kind as ManifestEvidenceKind,
      label: parsed.label,
      bodyBase64: parsed.bodyBase64,
      contentType: parsed.contentType,
      inlinePayload: parsed.inlinePayload,
    });

    const item = await submissionRepository.updateEvidenceItem({
      id: existing.id,
      kind: parsed.kind as ManifestEvidenceKind,
      label: parsed.label,
      stepKey: parsed.stepKey,
      reference: built.reference,
      contentHash: built.contentHash,
      sizeBytes: built.sizeBytes,
      inlinePayload: built.inlinePayload,
      metadata: parsed.metadata ?? null,
    });
    return apiSuccess(item);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "REPLACE_FAILED",
      error instanceof Error ? error.message : "Could not replace evidence",
    );
  }
}

export async function removeEvidence(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<{ removed: true }>> {
  try {
    const parsed = removeEvidenceSchema.parse(params.input);
    const pkg = await loadMutablePackage({
      publicId: parsed.submissionPublicId,
      workerUserId: params.workerUserId,
    });
    const existing = await submissionRepository.findEvidenceItem(
      parsed.evidenceItemId,
    );
    if (!existing || existing.manifestId !== pkg.manifest.id) {
      throw new AppError("EVIDENCE_NOT_FOUND", "Evidence item not found", 404);
    }

    try {
      const adapter = getEvidenceStorageAdapter();
      if (existing.reference.adapter === adapter.providerKey) {
        await adapter.remove(existing.reference);
      }
    } catch {
      // ignore
    }

    await submissionRepository.deleteEvidenceItem(existing.id);
    return apiSuccess({ removed: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "REMOVE_FAILED",
      error instanceof Error ? error.message : "Could not remove evidence",
    );
  }
}

export async function markSubmissionReady(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<SubmissionPackage>> {
  try {
    const parsed = markSubmissionReadySchema.parse(params.input);
    const submission = await submissionRepository.findByPublicId(
      parsed.submissionPublicId,
    );
    if (!submission) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }
    assertSubmissionAccess({
      workerUserId: submission.workerUserId,
      actorUserId: params.workerUserId,
    });
    assertSubmissionTransition(submission.status, "ready");
    const pkg = await submissionRepository.getPackage(submission.id);
    if (!pkg) {
      throw new AppError("PACKAGE_INCOMPLETE", "Manifest missing", 500);
    }
    if (pkg.items.length === 0) {
      throw new AppError("EMPTY_MANIFEST", "Attach at least one evidence item", 400);
    }

    await submissionRepository.setStatus({
      id: submission.id,
      status: "ready",
      readyAt: new Date(),
    });
    const updated = await submissionRepository.getPackage(submission.id);
    if (!updated) {
      throw new AppError("PACKAGE_MISSING", "Package missing after ready", 500);
    }
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "READY_FAILED",
      error instanceof Error ? error.message : "Could not mark ready",
    );
  }
}

export async function submitPackage(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<SubmissionPackage>> {
  try {
    const parsed = submitPackageSchema.parse(params.input);
    const submission = await submissionRepository.findByPublicId(
      parsed.submissionPublicId,
    );
    if (!submission) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }
    if (submission.workerUserId !== params.workerUserId) {
      throw new AppError("FORBIDDEN", "Submission belongs to another worker", 403);
    }

    // Allow submit from ready, or auto-ready from draft if evidence present
    if (submission.status === "draft") {
      assertSubmissionTransition("draft", "ready");
      await submissionRepository.setStatus({
        id: submission.id,
        status: "ready",
        readyAt: new Date(),
      });
    }

    const current = await submissionRepository.findById(submission.id);
    if (!current) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }
    assertSubmissionTransition(current.status, "submitted");

    const pkg = await submissionRepository.getPackage(current.id);
    if (!pkg || pkg.items.length === 0) {
      throw new AppError("EMPTY_MANIFEST", "Cannot submit empty package", 400);
    }

    const assignment = await assignmentRepository.findById(current.assignmentId);
    if (!assignment) {
      throw new AppError("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
    }

    const checklist = await assignmentRepository.listChecklist(assignment.id);
    const progress = calculateAssignmentProgress({
      steps: checklist.map((step) => ({
        required: step.executionStep?.required ?? true,
        status: step.status,
        estimatedDurationMin: step.executionStep?.estimatedDurationMin ?? null,
      })),
      startedAt: assignment.startedAt,
      lastActivityAt: assignment.lastActivityAt,
      completedAt: assignment.completedAt,
    });

    const notes = await assignmentRepository.listNotes(assignment.id);
    const submittedAt = new Date();
    const summary = generateSubmissionSummary({
      startedAt: assignment.startedAt,
      submittedAt: submittedAt.toISOString(),
      completedSteps: progress.completedSteps,
      requiredSteps: progress.requiredSteps,
      requiredCompleted: progress.requiredCompleted,
      progressPercent: progress.progressPercent,
      evidenceKinds: pkg.items.map((i) => i.kind),
      workerNotes: notes
        .filter((n) => n.visibility === "worker_private")
        .map((n) => n.body),
      executionContextKeys: Object.keys(current.executionContextSnapshot),
    });

    let assignmentStatus = assignment.status;
    if (
      assignmentStatus !== "ready_for_submission" &&
      canTransitionAssignment(assignmentStatus, "ready_for_submission")
    ) {
      await assignmentRepository.updateStatus({
        id: assignment.id,
        status: "ready_for_submission",
      });
      assignmentStatus = "ready_for_submission";
    }
    assertAssignmentTransition(assignmentStatus, "submitted");

    await submissionRepository.finalizeManifest(pkg.manifest.id);
    await submissionRepository.upsertSummary({
      submissionId: current.id,
      summary,
    });
    await submissionRepository.setStatus({
      id: current.id,
      status: "submitted",
      submittedAt,
      finalizedAt: submittedAt,
      timingMetrics: {
        timeSpentSeconds: summary.timeSpentSeconds,
        submittedAt: submittedAt.toISOString(),
      },
    });

    await assignmentRepository.updateStatus({
      id: assignment.id,
      status: "submitted",
      submittedAt,
    });
    await assignmentRepository.addTimelineEvent({
      assignmentId: assignment.id,
      eventType: "submitted",
      actorUserId: params.workerUserId,
      payload: { submissionPublicId: current.publicId },
    });

    const finalized = await submissionRepository.getPackage(current.id);
    if (!finalized) {
      throw new AppError("PACKAGE_MISSING", "Package missing after submit", 500);
    }

    // Continuous pipeline: submitted → validating → validation_complete
    const { runValidation } = await import(
      "@/features/verification/services/validation-service"
    );
    await runValidation({
      input: { submissionPublicId: current.publicId },
    });

    const afterValidation = await submissionRepository.getPackage(current.id);
    return apiSuccess(afterValidation ?? finalized);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "SUBMIT_FAILED",
      error instanceof Error ? error.message : "Could not submit package",
    );
  }
}

export async function getSubmissionPackage(params: {
  publicId: string;
  actorUserId: string;
  platformRoles?: readonly string[];
}): Promise<ApiResponse<SubmissionPackage>> {
  try {
    const submission = await submissionRepository.findByPublicId(params.publicId);
    if (!submission) {
      throw new AppError("NOT_FOUND", "Submission not found", 404);
    }
    assertSubmissionAccess({
      workerUserId: submission.workerUserId,
      actorUserId: params.actorUserId,
      allowReviewer: true,
      platformRoles: params.platformRoles,
    });
    const pkg = await submissionRepository.getPackage(submission.id);
    if (!pkg) {
      throw new AppError("PACKAGE_INCOMPLETE", "Package incomplete", 500);
    }
    return apiSuccess(pkg);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "GET_FAILED",
      error instanceof Error ? error.message : "Could not load submission",
    );
  }
}
