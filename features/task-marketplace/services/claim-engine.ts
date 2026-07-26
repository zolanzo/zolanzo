import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import type { ClaimPolicyRule } from "@/constants/claim-policies";
import type { TemplateConstraint } from "@/constants/constraints";
import { mergeEligibilityRules } from "@/features/campaigns/services/eligibility";
import {
  assignmentRepository,
  reservationRepository,
} from "@/features/assignments/repositories";
import type { AssignmentRecord } from "@/features/assignments/types";
import type { ReservationRecord } from "@/features/assignments/types";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";
import type { TemplateStepDefinition } from "@/features/task-templates/types";
import { hydrateAssignmentWorkspace } from "@/features/assignments/services/workspace-service";
import { evaluateWorkerEligibility } from "@/features/task-marketplace/services/eligibility-evaluate";
import { evaluateClaimPolicies } from "@/features/task-marketplace/services/claim-policies";
import {
  expireReservations,
  reserveTaskInstance,
} from "@/features/task-marketplace/services/reservation-engine";
import {
  claimOpportunitySchema,
  confirmClaimSchema,
  reserveOpportunitySchema,
} from "@/features/task-marketplace/validators";
import type { WorkerEligibilityContext } from "@/features/task-marketplace/types/worker-context";

async function loadOpportunityContext(instancePublicId: string) {
  const instance = await prisma.taskInstance.findUnique({
    where: { publicId: instancePublicId },
    include: {
      campaign: true,
      taskTemplate: true,
    },
  });
  if (!instance) {
    throw new AppError("NOT_FOUND", "Work opportunity not found", 404);
  }
  return instance;
}

async function assertCanClaim(params: {
  instance: Awaited<ReturnType<typeof loadOpportunityContext>>;
  worker: WorkerEligibilityContext;
}): Promise<void> {
  const { instance, worker } = params;
  const campaign = instance.campaign;
  const template = instance.taskTemplate;

  if (instance.status !== "available") {
    throw new AppError(
      "INVENTORY_UNAVAILABLE",
      "Work opportunity is not claimable",
      409,
    );
  }

  if (campaign.status !== "active") {
    throw new AppError(
      "CAMPAIGN_NOT_ACTIVE",
      "Campaign is not open for claims",
      409,
    );
  }

  const merged = mergeEligibilityRules({
    templateConstraints: template.constraints as TemplateConstraint[],
    campaignConstraints: campaign.audienceConstraints as TemplateConstraint[],
  });
  if (!merged.ok) {
    throw new AppError("ELIGIBILITY_INVALID", merged.errors.join("; "), 400);
  }

  const eligibility = evaluateWorkerEligibility({
    constraints: merged.constraints,
    worker,
    countryScope: campaign.countryScope as string[],
    languageScope: campaign.languageScope as string[],
    deviceScope: campaign.deviceScope as string[],
  });
  if (!eligibility.eligible) {
    throw new AppError(
      "NOT_ELIGIBLE",
      eligibility.hardFailures.map((f) => f.reason).join("; "),
      403,
    );
  }

  const [activeTotal, activeCampaign, lastCompletedAt] = await Promise.all([
    assignmentRepository.countActiveForWorker(worker.userId),
    assignmentRepository.countActiveForWorkerCampaign(
      worker.userId,
      campaign.id,
    ),
    assignmentRepository.lastCompletedAt(worker.userId),
  ]);

  const policy = evaluateClaimPolicies({
    rules: campaign.claimPolicies as ClaimPolicyRule[],
    worker,
    campaignOrganizationId: campaign.organizationId,
    stats: {
      activeAssignmentCount: activeTotal,
      activeAssignmentsForCampaign: activeCampaign,
      lastCompletedAt,
    },
  });
  if (!policy.allowed) {
    throw new AppError("CLAIM_POLICY_DENIED", policy.errors.join("; "), 403);
  }

  const existing = await assignmentRepository.findByTaskInstanceId(instance.id);
  if (existing) {
    throw new AppError(
      "ALREADY_CLAIMED",
      "This work opportunity already has an assignment",
      409,
    );
  }
}

export async function reserveWorkOpportunity(params: {
  input: unknown;
}): Promise<ApiResponse<ReservationRecord>> {
  try {
    await expireReservations();
    const parsed = reserveOpportunitySchema.parse(params.input);
    const instance = await loadOpportunityContext(parsed.instancePublicId);
    await assertCanClaim({ instance, worker: parsed.worker });

    if (instance.status !== "available") {
      throw new AppError(
        "INVENTORY_UNAVAILABLE",
        "Work opportunity is no longer available",
        409,
      );
    }

    const reservation = await reserveTaskInstance({
      taskInstanceId: instance.id,
      workerUserId: parsed.worker.userId,
      campaignId: instance.campaignId,
      timeoutSeconds: instance.campaign.reservationTimeoutSeconds,
    });
    return apiSuccess(reservation);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "RESERVE_FAILED",
      error instanceof Error ? error.message : "Could not reserve work",
    );
  }
}

export async function confirmClaim(params: {
  input: unknown;
}): Promise<ApiResponse<AssignmentRecord>> {
  try {
    const parsed = confirmClaimSchema.parse(params.input);
    const reservation = await reservationRepository.findById(
      parsed.reservationId,
    );
    if (!reservation) {
      throw new AppError("NOT_FOUND", "Reservation not found", 404);
    }
    if (reservation.workerUserId !== parsed.workerUserId) {
      throw new AppError("FORBIDDEN", "Reservation belongs to another worker", 403);
    }
    if (reservation.status !== "pending") {
      throw new AppError(
        "RESERVATION_NOT_PENDING",
        `Reservation status is ${reservation.status}`,
        409,
      );
    }
    if (new Date(reservation.expiresAt).getTime() <= Date.now()) {
      await expireReservations();
      throw new AppError("RESERVATION_EXPIRED", "Reservation has expired", 409);
    }

    const instance = await prisma.taskInstance.findUnique({
      where: { id: reservation.taskInstanceId },
      include: { campaign: true, taskTemplate: true },
    });
    if (!instance) {
      throw new AppError("NOT_FOUND", "Task instance not found", 404);
    }

    const existing = await assignmentRepository.findByTaskInstanceId(instance.id);
    if (existing) {
      throw new AppError("ALREADY_CLAIMED", "Assignment already exists", 409);
    }

    const publicId = await generatePublicId("assignment");

    const workerCtx: WorkerEligibilityContext = parsed.worker ?? {
      userId: parsed.workerUserId,
      countryCode: null,
      languages: [],
      skills: [],
      platforms: [],
      devices: [],
      trustScore: 50,
      approvalRate: 1,
      completedTasks: 0,
      organizationIds: [],
    };

    const merged = mergeEligibilityRules({
      templateConstraints: instance.taskTemplate
        .constraints as TemplateConstraint[],
      campaignConstraints: instance.campaign
        .audienceConstraints as TemplateConstraint[],
    });
    const eligibility = evaluateWorkerEligibility({
      constraints: merged.constraints,
      worker: workerCtx,
      countryScope: instance.campaign.countryScope as string[],
      languageScope: instance.campaign.languageScope as string[],
      deviceScope: instance.campaign.deviceScope as string[],
    });

    const [activeTotal, activeCampaign] = await Promise.all([
      assignmentRepository.countActiveForWorker(parsed.workerUserId),
      assignmentRepository.countActiveForWorkerCampaign(
        parsed.workerUserId,
        instance.campaignId,
      ),
    ]);
    const claimPolicy = evaluateClaimPolicies({
      rules: instance.campaign.claimPolicies as ClaimPolicyRule[],
      worker: workerCtx,
      campaignOrganizationId: instance.campaign.organizationId,
      stats: {
        activeAssignmentCount: activeTotal,
        activeAssignmentsForCampaign: activeCampaign,
        lastCompletedAt: await assignmentRepository.lastCompletedAt(
          parsed.workerUserId,
        ),
      },
    });

    const executionContext: ExecutionContext = {
      taskTemplateId: instance.taskTemplateId,
      taskTemplateVersion: instance.taskTemplateVersion,
      taskTemplatePublicId: instance.taskTemplate.publicId,
      campaignId: instance.campaignId,
      campaignPublicId: instance.campaign.publicId,
      campaignRevisionAt: instance.campaign.updatedAt.toISOString(),
      workerUserId: parsed.workerUserId,
      workerTrustScore: workerCtx.trustScore,
      eligibility: {
        eligible: eligibility.eligible,
        hardFailureIds: eligibility.hardFailures.map((f) => f.constraintId),
        softWarningIds: eligibility.softWarnings.map((f) => f.constraintId),
      },
      claimPolicy: {
        allowed: claimPolicy.allowed,
        errors: claimPolicy.errors,
        deferred: claimPolicy.deferred,
        rulesApplied: (instance.campaign.claimPolicies as ClaimPolicyRule[]).map(
          (r) => r.kind,
        ),
      },
      device: {
        platforms: workerCtx.platforms,
        devices: workerCtx.devices,
      },
      countryCode: workerCtx.countryCode,
      languages: workerCtx.languages,
      activeOrganizationId: workerCtx.organizationIds[0] ?? null,
      rewardSnapshot: {
        rewardPerUnitMinor: instance.campaign.rewardPerUnitMinor,
        currency: instance.campaign.currency,
        strategyOverride: instance.campaign.rewardStrategyOverride,
      },
      capturedAt: new Date().toISOString(),
    };

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          publicId,
          taskInstanceId: instance.id,
          campaignId: instance.campaignId,
          workerUserId: parsed.workerUserId,
          taskTemplateId: instance.taskTemplateId,
          taskTemplateVersion: instance.taskTemplateVersion,
          reservationId: reservation.id,
          status: "assigned",
          priority: instance.priority,
          executionContext: executionContext as unknown as Prisma.InputJsonValue,
          lastActivityAt: new Date(),
        },
      });

      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "converted",
          confirmedAt: new Date(),
          convertedAt: new Date(),
        },
      });

      await tx.taskInstance.update({
        where: { id: instance.id },
        data: {
          status: "claimed",
          reserved: false,
        },
      });

      return created;
    });

    await hydrateAssignmentWorkspace({
      assignmentId: assignment.id,
      capabilitySet: instance.taskTemplate
        .capabilitySet as TemplateStepDefinition[],
      estimatedDurationMin: instance.taskTemplate.estimatedDurationMin,
      actorUserId: parsed.workerUserId,
    });

    const record = await assignmentRepository.findById(assignment.id);
    if (!record) {
      throw new AppError("ASSIGNMENT_MISSING", "Assignment create failed", 500);
    }
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CONFIRM_FAILED",
      error instanceof Error ? error.message : "Could not confirm claim",
    );
  }
}

/**
 * One-shot claim: reserve + confirm in sequence.
 */
export async function claimWorkOpportunity(params: {
  input: unknown;
}): Promise<
  ApiResponse<{ reservation: ReservationRecord; assignment: AssignmentRecord }>
> {
  try {
    const parsed = claimOpportunitySchema.parse(params.input);
    const reserved = await reserveWorkOpportunity({
      input: {
        instancePublicId: parsed.instancePublicId,
        worker: parsed.worker,
      },
    });
    if (!reserved.ok) return reserved;

    const confirmed = await confirmClaim({
      input: {
        reservationId: reserved.data.id,
        workerUserId: parsed.worker.userId,
        worker: parsed.worker,
      },
    });
    if (!confirmed.ok) return confirmed;

    return apiSuccess({
      reservation: reserved.data,
      assignment: confirmed.data,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CLAIM_FAILED",
      error instanceof Error ? error.message : "Could not claim work",
    );
  }
}
