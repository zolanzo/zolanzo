"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type {
  EvidenceItemRecord,
  SubmissionPackage,
} from "@/features/submissions/types";
import {
  attachEvidence,
  createDraftSubmission,
  getSubmissionPackage,
  markSubmissionReady,
  removeEvidence,
  replaceEvidence,
  submitPackage,
} from "@/features/submissions/services/submission-service";

export async function createDraftSubmissionAction(
  input: unknown,
): Promise<ApiResponse<SubmissionPackage>> {
  const ctx = await requireAuthContext();
  return createDraftSubmission({
    input,
    workerUserId: ctx.user.id,
  });
}

export async function attachEvidenceAction(
  input: unknown,
): Promise<ApiResponse<EvidenceItemRecord>> {
  await requireAuthContext();
  return attachEvidence({ input });
}

export async function replaceEvidenceAction(
  input: unknown,
): Promise<ApiResponse<EvidenceItemRecord>> {
  await requireAuthContext();
  return replaceEvidence({ input });
}

export async function removeEvidenceAction(
  input: unknown,
): Promise<ApiResponse<{ removed: true }>> {
  await requireAuthContext();
  return removeEvidence({ input });
}

export async function markSubmissionReadyAction(
  submissionPublicId: string,
): Promise<ApiResponse<SubmissionPackage>> {
  await requireAuthContext();
  return markSubmissionReady({ input: { submissionPublicId } });
}

export async function submitPackageAction(
  submissionPublicId: string,
): Promise<ApiResponse<SubmissionPackage>> {
  const ctx = await requireAuthContext();
  return submitPackage({
    input: { submissionPublicId },
    workerUserId: ctx.user.id,
  });
}

export async function getSubmissionPackageAction(
  publicId: string,
): Promise<ApiResponse<SubmissionPackage>> {
  await requireAuthContext();
  return getSubmissionPackage({ publicId });
}
