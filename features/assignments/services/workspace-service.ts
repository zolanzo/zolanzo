import "server-only";

import { prisma } from "@/lib/prisma/client";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import type { AssignmentStepStatus } from "@/constants/work-states";
import type { CampaignBrief } from "@/features/campaigns/types";
import type { TemplateStepDefinition } from "@/features/task-templates/types";
import type { EvidenceRequirement } from "@/features/task-templates/types";
import {
  buildExecutionPlan,
  assertExecutionOrder,
} from "@/features/assignments/services/execution-engine";
import {
  assertStepTransition,
  canSkipStep,
  dependenciesSatisfied,
} from "@/features/assignments/services/checklist-engine";
import { calculateAssignmentProgress } from "@/features/assignments/services/progress-engine";
import {
  assertAssignmentTransition,
} from "@/features/assignments/services/lifecycle";
import { assignmentRepository } from "@/features/assignments/repositories";
import type {
  AssignmentNoteRecord,
  AssignmentRecord,
  AssignmentWorkspace,
} from "@/features/assignments/types";
import {
  addAssignmentNoteSchema,
  getWorkspaceSchema,
  markReadyForSubmissionSchema,
  pauseAssignmentSchema,
  resumeAssignmentSchema,
  startAssignmentSchema,
  transitionChecklistSchema,
} from "@/features/assignments/validators";

async function loadAssignmentOrThrow(publicId: string) {
  const assignment = await assignmentRepository.findByPublicId(publicId);
  if (!assignment) {
    throw new AppError("NOT_FOUND", "Assignment not found", 404);
  }
  return assignment;
}

async function refreshProgress(assignmentId: string): Promise<void> {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) return;
  const checklist = await assignmentRepository.listChecklist(assignmentId);
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
  await assignmentRepository.updateProgress({
    id: assignmentId,
    progressPercent: progress.progressPercent,
    estimatedRemainingMin: progress.estimatedRemainingMin,
  });
}

export async function getAssignmentWorkspace(params: {
  input: unknown;
}): Promise<ApiResponse<AssignmentWorkspace>> {
  try {
    const parsed = getWorkspaceSchema.parse(params.input);
    const assignment = await loadAssignmentOrThrow(parsed.assignmentPublicId);

    const [campaign, template, executionSteps, checklist, timeline, notes] =
      await Promise.all([
        prisma.campaign.findUnique({ where: { id: assignment.campaignId } }),
        prisma.taskTemplate.findUnique({
          where: { id: assignment.taskTemplateId },
        }),
        assignmentRepository.listExecutionSteps(assignment.id),
        assignmentRepository.listChecklist(assignment.id),
        assignmentRepository.listTimeline(assignment.id),
        assignmentRepository.listNotes(assignment.id),
      ]);

    if (!campaign || !template) {
      throw new AppError("WORKSPACE_INCOMPLETE", "Campaign or template missing", 500);
    }

    const brief = campaign.brief as CampaignBrief;
    const evidence = template.requiredEvidence as EvidenceRequirement[];
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

    return apiSuccess({
      assignment: {
        ...assignment,
        progressPercent: progress.progressPercent,
        estimatedRemainingMin: progress.estimatedRemainingMin,
      },
      overview: {
        title: campaign.name,
        category: campaign.category,
        objective: campaign.objective,
        description: campaign.description,
        campaignPublicId: campaign.publicId,
        templatePublicId: template.publicId,
        templateName: template.name,
        rewardPerUnitMinor: campaign.rewardPerUnitMinor,
        currency: campaign.currency,
      },
      instructions: {
        workerInstructions: brief.workerInstructions,
        qualityExpectations: brief.qualityExpectations,
        acceptableExamples: brief.acceptableExamples,
        unacceptableExamples: brief.unacceptableExamples,
      },
      executionSteps,
      checklist,
      progress,
      timeline,
      notes,
      evidencePlaceholder: {
        requiredKinds: evidence.filter((e) => e.required).map((e) => e.kind),
        message:
          "Evidence is attached on the Submission Package (Evidence Manifest).",
      },
      audit: {
        executionContext: assignment.executionContext,
        reservationId: assignment.reservationId,
        taskInstanceId: assignment.taskInstanceId,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "WORKSPACE_FAILED",
      error instanceof Error ? error.message : "Could not load workspace",
    );
  }
}

export async function startAssignment(params: {
  input: unknown;
  actorUserId: string;
}): Promise<ApiResponse<AssignmentRecord>> {
  try {
    const parsed = startAssignmentSchema.parse(params.input);
    const assignment = await loadAssignmentOrThrow(parsed.assignmentPublicId);
    assertAssignmentTransition(assignment.status, "started");

    const updated = await assignmentRepository.updateStatus({
      id: assignment.id,
      status: "started",
      startedAt: new Date(),
      pausedAt: null,
    });
    await assignmentRepository.addTimelineEvent({
      assignmentId: assignment.id,
      eventType: "started",
      actorUserId: params.actorUserId,
    });
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "START_FAILED",
      error instanceof Error ? error.message : "Could not start assignment",
    );
  }
}

export async function pauseAssignment(params: {
  input: unknown;
  actorUserId: string;
}): Promise<ApiResponse<AssignmentRecord>> {
  try {
    const parsed = pauseAssignmentSchema.parse(params.input);
    const assignment = await loadAssignmentOrThrow(parsed.assignmentPublicId);
    assertAssignmentTransition(assignment.status, "paused");

    const updated = await assignmentRepository.updateStatus({
      id: assignment.id,
      status: "paused",
      pausedAt: new Date(),
    });
    await assignmentRepository.addTimelineEvent({
      assignmentId: assignment.id,
      eventType: "paused",
      actorUserId: params.actorUserId,
    });
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PAUSE_FAILED",
      error instanceof Error ? error.message : "Could not pause assignment",
    );
  }
}

export async function resumeAssignment(params: {
  input: unknown;
  actorUserId: string;
}): Promise<ApiResponse<AssignmentRecord>> {
  try {
    const parsed = resumeAssignmentSchema.parse(params.input);
    const assignment = await loadAssignmentOrThrow(parsed.assignmentPublicId);
    assertAssignmentTransition(assignment.status, "in_progress");

    const updated = await assignmentRepository.updateStatus({
      id: assignment.id,
      status: "in_progress",
      pausedAt: null,
    });
    await assignmentRepository.addTimelineEvent({
      assignmentId: assignment.id,
      eventType: "resumed",
      actorUserId: params.actorUserId,
    });
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "RESUME_FAILED",
      error instanceof Error ? error.message : "Could not resume assignment",
    );
  }
}

export async function transitionChecklistStep(params: {
  input: unknown;
  actorUserId: string;
}): Promise<ApiResponse<AssignmentWorkspace["checklist"][number]>> {
  try {
    const parsed = transitionChecklistSchema.parse(params.input);
    const assignment = await loadAssignmentOrThrow(parsed.assignmentPublicId);
    const step = await assignmentRepository.findChecklistStep(
      parsed.assignmentStepId,
    );
    if (!step || step.assignmentId !== assignment.id) {
      throw new AppError("STEP_NOT_FOUND", "Checklist step not found", 404);
    }
    if (!step.executionStep) {
      throw new AppError("STEP_INVALID", "Execution step missing", 500);
    }

    assertStepTransition(step.status, parsed.to as AssignmentStepStatus);

    if (parsed.to === "skipped") {
      if (!canSkipStep(step.executionStep.required)) {
        throw new AppError(
          "STEP_REQUIRED",
          "Required steps cannot be skipped",
          400,
        );
      }
    }

    const checklist = await assignmentRepository.listChecklist(assignment.id);
    const statusByKey: Record<string, AssignmentStepStatus> = {};
    for (const item of checklist) {
      if (item.executionStep) {
        statusByKey[item.executionStep.stepKey] = item.status;
      }
    }

    if (
      (parsed.to === "in_progress" || parsed.to === "completed") &&
      !dependenciesSatisfied({
        dependsOnStepKeys: step.executionStep.dependsOnStepKeys,
        statusByKey,
      })
    ) {
      throw new AppError(
        "DEPENDENCIES_UNMET",
        "Complete prerequisite steps first",
        409,
      );
    }

    const now = new Date();
    const updated = await assignmentRepository.updateChecklistStep({
      id: step.id,
      status: parsed.to as AssignmentStepStatus,
      startedAt:
        parsed.to === "in_progress" || parsed.to === "completed"
          ? step.startedAt
            ? new Date(step.startedAt)
            : now
          : undefined,
      completedAt: parsed.to === "completed" || parsed.to === "skipped" ? now : undefined,
      failedAt: parsed.to === "failed" ? now : undefined,
      skipReason: parsed.to === "skipped" ? parsed.skipReason ?? null : undefined,
      failReason: parsed.to === "failed" ? parsed.failReason ?? null : undefined,
    });

    const eventType =
      parsed.to === "completed"
        ? "step_completed"
        : parsed.to === "skipped"
          ? "step_skipped"
          : parsed.to === "failed"
            ? "step_failed"
            : "step_started";

    await assignmentRepository.addTimelineEvent({
      assignmentId: assignment.id,
      eventType,
      actorUserId: params.actorUserId,
      payload: { stepKey: step.executionStep.stepKey, status: parsed.to },
    });

    // Auto-promote assignment into in_progress when first step starts
    if (parsed.to === "in_progress") {
      if (
        assignment.status === "assigned" ||
        assignment.status === "claimed"
      ) {
        await assignmentRepository.updateStatus({
          id: assignment.id,
          status: "started",
          startedAt: assignment.startedAt
            ? new Date(assignment.startedAt)
            : now,
        });
        await assignmentRepository.updateStatus({
          id: assignment.id,
          status: "in_progress",
        });
      } else if (assignment.status === "started") {
        await assignmentRepository.updateStatus({
          id: assignment.id,
          status: "in_progress",
        });
      }
    }

    await refreshProgress(assignment.id);
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CHECKLIST_FAILED",
      error instanceof Error ? error.message : "Could not update checklist",
    );
  }
}

export async function markReadyForSubmission(params: {
  input: unknown;
  actorUserId: string;
}): Promise<ApiResponse<AssignmentRecord>> {
  try {
    const parsed = markReadyForSubmissionSchema.parse(params.input);
    const assignment = await loadAssignmentOrThrow(parsed.assignmentPublicId);
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
    if (!progress.readyForSubmission) {
      throw new AppError(
        "NOT_READY",
        "Required checklist steps are incomplete",
        409,
      );
    }

    assertAssignmentTransition(assignment.status, "ready_for_submission");
    const updated = await assignmentRepository.updateStatus({
      id: assignment.id,
      status: "ready_for_submission",
      progressPercent: progress.progressPercent,
      estimatedRemainingMin: progress.estimatedRemainingMin,
    });
    await assignmentRepository.addTimelineEvent({
      assignmentId: assignment.id,
      eventType: "ready_for_submission",
      actorUserId: params.actorUserId,
    });
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "READY_FAILED",
      error instanceof Error ? error.message : "Could not mark ready",
    );
  }
}

export async function addAssignmentNote(params: {
  input: unknown;
  actorUserId: string;
}): Promise<ApiResponse<AssignmentNoteRecord>> {
  try {
    const parsed = addAssignmentNoteSchema.parse(params.input);
    const assignment = await loadAssignmentOrThrow(parsed.assignmentPublicId);
    const note = await assignmentRepository.createNote({
      assignmentId: assignment.id,
      authorUserId: params.actorUserId,
      body: parsed.body,
      visibility: parsed.visibility,
    });
    await assignmentRepository.addTimelineEvent({
      assignmentId: assignment.id,
      eventType: "note_added",
      actorUserId: params.actorUserId,
      payload: { noteId: note.id, visibility: note.visibility },
    });
    return apiSuccess(note);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "NOTE_FAILED",
      error instanceof Error ? error.message : "Could not add note",
    );
  }
}

/**
 * Hydrate execution plan + timeline for a newly created assignment.
 */
export async function hydrateAssignmentWorkspace(params: {
  assignmentId: string;
  capabilitySet: readonly TemplateStepDefinition[];
  estimatedDurationMin?: number | null;
  actorUserId: string;
}): Promise<void> {
  const plan = buildExecutionPlan({
    capabilitySet: params.capabilitySet,
    estimatedDurationMin: params.estimatedDurationMin,
  });
  const order = assertExecutionOrder(plan);
  if (!order.ok) {
    throw new AppError("EXECUTION_PLAN_INVALID", order.errors.join("; "), 400);
  }

  await assignmentRepository.hydrateExecutionPlan({
    assignmentId: params.assignmentId,
    plan,
  });
  await assignmentRepository.addTimelineEvent({
    assignmentId: params.assignmentId,
    eventType: "claimed",
    actorUserId: params.actorUserId,
  });
  await refreshProgress(params.assignmentId);
}
