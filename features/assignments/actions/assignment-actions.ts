"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type {
  AssignmentNoteRecord,
  AssignmentRecord,
  AssignmentStepRecord,
  AssignmentWorkspace,
} from "@/features/assignments/types";
import {
  addAssignmentNote,
  getAssignmentWorkspace,
  markReadyForSubmission,
  pauseAssignment,
  resumeAssignment,
  startAssignment,
  transitionChecklistStep,
} from "@/features/assignments/services/workspace-service";
import { assignmentRepository } from "@/features/assignments/repositories";

export async function getAssignmentWorkspaceAction(
  assignmentPublicId: string,
): Promise<ApiResponse<AssignmentWorkspace>> {
  await requireAuthContext();
  return getAssignmentWorkspace({ input: { assignmentPublicId } });
}

export async function startAssignmentAction(
  assignmentPublicId: string,
): Promise<ApiResponse<AssignmentRecord>> {
  const ctx = await requireAuthContext();
  return startAssignment({
    input: { assignmentPublicId },
    actorUserId: ctx.user.id,
  });
}

export async function pauseAssignmentAction(
  assignmentPublicId: string,
): Promise<ApiResponse<AssignmentRecord>> {
  const ctx = await requireAuthContext();
  return pauseAssignment({
    input: { assignmentPublicId },
    actorUserId: ctx.user.id,
  });
}

export async function resumeAssignmentAction(
  assignmentPublicId: string,
): Promise<ApiResponse<AssignmentRecord>> {
  const ctx = await requireAuthContext();
  return resumeAssignment({
    input: { assignmentPublicId },
    actorUserId: ctx.user.id,
  });
}

export async function transitionChecklistAction(
  input: unknown,
): Promise<ApiResponse<AssignmentStepRecord>> {
  const ctx = await requireAuthContext();
  return transitionChecklistStep({
    input,
    actorUserId: ctx.user.id,
  });
}

export async function markReadyForSubmissionAction(
  assignmentPublicId: string,
): Promise<ApiResponse<AssignmentRecord>> {
  const ctx = await requireAuthContext();
  return markReadyForSubmission({
    input: { assignmentPublicId },
    actorUserId: ctx.user.id,
  });
}

export async function addAssignmentNoteAction(
  input: unknown,
): Promise<ApiResponse<AssignmentNoteRecord>> {
  const ctx = await requireAuthContext();
  return addAssignmentNote({
    input,
    actorUserId: ctx.user.id,
  });
}

export async function getAssignmentAction(
  publicId: string,
): Promise<ApiResponse<AssignmentRecord>> {
  await requireAuthContext();
  const row = await assignmentRepository.findByPublicId(publicId);
  if (!row) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Assignment not found" },
    };
  }
  return { ok: true, data: row };
}
