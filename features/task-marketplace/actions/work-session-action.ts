"use server";

import { prisma } from "@/lib/prisma/client";
import { requireAuthContext } from "@/lib/auth/session";
import { apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { assignmentRepository } from "@/features/assignments/repositories";
import { startAssignment } from "@/features/assignments/services/workspace-service";
import { createDraftSubmission } from "@/features/submissions/services/submission-service";
import { proofFieldsFromTemplate } from "@/features/task-marketplace/services/evidence-requirements";
import type { WorkProofField } from "@/features/task-marketplace/services/evidence-requirements";
import type { CampaignBrief } from "@/features/campaigns/types";
import type { EvidenceRequirement } from "@/features/task-templates/types";
import type { TemplateStepDefinition } from "@/features/task-templates/types";
import type { SubmissionPackage } from "@/features/submissions/types";

export type OpportunityWorkSession = {
  instancePublicId: string;
  assignmentPublicId: string;
  assignmentStatus: string;
  submissionPublicId: string | null;
  submissionStatus: string | null;
  workerInstructions: string;
  proofFields: WorkProofField[];
  package: SubmissionPackage | null;
};

export async function prepareOpportunityWorkAction(
  instancePublicId: string,
): Promise<ApiResponse<OpportunityWorkSession>> {
  const ctx = await requireAuthContext();
  const instance = await prisma.taskInstance.findFirst({
    where: { publicId: instancePublicId },
    include: { campaign: true, taskTemplate: true },
  });
  if (!instance) {
    return apiError("NOT_FOUND", "Task not found.");
  }

  const assignment = await assignmentRepository.findByTaskInstanceId(
    instance.id,
  );
  if (!assignment || assignment.workerUserId !== ctx.user.id) {
    return apiError(
      "NOT_ASSIGNED",
      "Start this task before submitting proof.",
    );
  }

  let assignmentStatus = assignment.status;
  let assignmentPublicId = assignment.publicId;

  if (assignmentStatus === "assigned" || assignmentStatus === "claimed") {
    const started = await startAssignment({
      input: { assignmentPublicId },
      actorUserId: ctx.user.id,
    });
    if (!started.ok) return started;
    assignmentStatus = started.data.status;
    assignmentPublicId = started.data.publicId;
  }

  const brief = instance.campaign.brief as CampaignBrief | null;
  const proofFields = proofFieldsFromTemplate({
    requiredEvidence: instance.taskTemplate
      .requiredEvidence as EvidenceRequirement[],
    capabilitySet: instance.taskTemplate
      .capabilitySet as TemplateStepDefinition[],
  });

  const submittedStatuses = new Set([
    "submitted",
    "validating",
    "validation_complete",
    "in_review",
    "approved",
    "rejected",
    "revision_requested",
    "closed",
  ]);

  if (submittedStatuses.has(assignmentStatus)) {
    const existing = await prisma.submission.findFirst({
      where: { assignmentId: assignment.id, workerUserId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      select: { publicId: true, status: true },
    });
    return apiSuccess({
      instancePublicId,
      assignmentPublicId,
      assignmentStatus,
      submissionPublicId: existing?.publicId ?? null,
      submissionStatus: existing?.status ?? null,
      workerInstructions: brief?.workerInstructions ?? instance.campaign.description,
      proofFields,
      package: null,
    });
  }

  const draft = await createDraftSubmission({
    input: { assignmentPublicId },
    workerUserId: ctx.user.id,
  });
  if (!draft.ok) return draft;

  return apiSuccess({
    instancePublicId,
    assignmentPublicId,
    assignmentStatus,
    submissionPublicId: draft.data.submission.publicId,
    submissionStatus: draft.data.submission.status,
    workerInstructions: brief?.workerInstructions ?? instance.campaign.description,
    proofFields,
    package: draft.data,
  });
}
