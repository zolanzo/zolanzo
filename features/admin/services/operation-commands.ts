/**
 * Operation Commands — auditable ops actions over domain services.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  OPERATION_COMMAND_TARGETS,
  OPERATION_COMMAND_TYPES,
  OPERATIONAL_QUEUE_KEYS,
  type OperationCommandStatus,
  type OperationCommandTarget,
  type OperationCommandType,
  type OperationalQueueKey,
} from "@/constants/operations";
import type { Role } from "@/constants/roles";
import {
  canExecuteCommand,
  isReadOnlyOps,
} from "@/features/admin/services/rbac-operations";
import { isPlaybookKey } from "@/features/admin/services/playbooks";
import { dispatchNotificationJob } from "@/features/notifications/services/notification-hub";
import { cancelWithdrawal } from "@/features/withdrawals/services/withdrawal-service";
import { archiveCampaign } from "@/features/campaigns/services/campaign-service";
import { verifyAndCompletePayment } from "@/features/payments/services/payment-platform";
import {
  enrichRequestContext,
  ensureRequestContext,
  getCorrelationId,
} from "@/lib/observability/request-context";
import { logger } from "@/lib/observability/logger";
import { z } from "zod";

export type OperationCommandRecord = {
  id: string;
  publicId: string;
  commandType: OperationCommandType;
  targetType: OperationCommandTarget;
  targetId: string;
  status: OperationCommandStatus;
  reversible: boolean;
};

export const executeOperationCommandSchema = z.object({
  commandType: z.enum(OPERATION_COMMAND_TYPES),
  targetType: z.enum(OPERATION_COMMAND_TARGETS),
  targetId: z.string().min(1),
  targetPublicId: z.string().min(1).optional().nullable(),
  queueKey: z.enum(OPERATIONAL_QUEUE_KEYS).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  payload: z.record(z.string(), z.unknown()).optional().nullable(),
  playbookKey: z.string().min(1).optional().nullable(),
  idempotencyKey: z.string().min(8).max(128),
});

function inferQueue(
  targetType: OperationCommandTarget,
  queueKey?: OperationalQueueKey | null,
): OperationalQueueKey | null {
  if (queueKey) return queueKey;
  switch (targetType) {
    case "notification_job":
      return "notification";
    case "settlement":
      return "settlement";
    case "withdrawal":
      return "withdrawal";
    case "review_queue_item":
      return "review";
    case "payment_intent":
      return "payment";
    case "user":
    case "moderation_case":
      return "moderation";
    default:
      return null;
  }
}

async function applyDomainEffect(params: {
  commandType: OperationCommandType;
  targetType: OperationCommandTarget;
  targetId: string;
  actorUserId: string;
  payload?: Record<string, unknown> | null;
}): Promise<{
  status: OperationCommandStatus;
  reversible: boolean;
  result: Record<string, unknown>;
}> {
  const { commandType, targetType, targetId } = params;

  if (targetType === "notification_job") {
    if (commandType === "retry" || commandType === "requeue") {
      await prisma.notificationJob.update({
        where: { id: targetId },
        data: {
          status: "scheduled",
          scheduledAt: new Date(),
          failureDetails: undefined,
        },
      });
      const dispatched = await dispatchNotificationJob({
        input: { jobId: targetId, preferLive: true },
      });
      return {
        status: dispatched.ok ? "applied" : "failed",
        reversible: false,
        result: { dispatch: dispatched },
      };
    }
  }

  if (targetType === "withdrawal" && commandType === "cancel") {
    const request = await prisma.withdrawalRequest.findFirst({
      where: { OR: [{ id: targetId }, { publicId: targetId }] },
    });
    if (!request) {
      return {
        status: "failed",
        reversible: false,
        result: { error: "withdrawal_not_found" },
      };
    }
    const cancelled = await cancelWithdrawal({
      input: { withdrawalPublicId: request.publicId },
      workerUserId: request.workerUserId,
    });
    return {
      status: cancelled.ok ? "applied" : "failed",
      reversible: false,
      result: { cancel: cancelled },
    };
  }

  if (targetType === "campaign" && commandType === "archive") {
    const archived = await archiveCampaign({
      id: targetId,
      updatedByUserId: params.actorUserId,
    });
    return {
      status: archived.ok ? "applied" : "failed",
      reversible: true,
      result: { archive: archived },
    };
  }

  if (targetType === "payment_intent" && commandType === "retry") {
    const intent = await prisma.paymentIntent.findUnique({
      where: { id: targetId },
    });
    if (!intent) {
      return {
        status: "failed",
        reversible: false,
        result: { error: "payment_intent_not_found" },
      };
    }
    const verified = await verifyAndCompletePayment({
      input: { paymentPublicId: intent.publicId },
    });
    return {
      status: verified.ok ? "applied" : "failed",
      reversible: false,
      result: { verify: verified },
    };
  }

  if (targetType === "review_queue_item" && commandType === "escalate") {
    const updated = await prisma.reviewQueueItem.update({
      where: { id: targetId },
      data: { status: "escalated", lifecycleStatus: "escalated" },
    });
    return {
      status: "applied",
      reversible: true,
      result: { reviewQueueItemId: updated.id, status: updated.status },
    };
  }

  if (targetType === "user") {
    if (commandType === "suspend") {
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { status: "suspended", suspendedAt: new Date() },
      });
      return {
        status: "applied",
        reversible: true,
        result: { userId: updated.id, status: updated.status },
      };
    }
    if (commandType === "resume" || commandType === "unlock") {
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { status: "active", suspendedAt: null },
      });
      // Unlock also clears revoked sessions for the user
      if (commandType === "unlock") {
        await prisma.session.updateMany({
          where: { userId: targetId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return {
        status: "applied",
        reversible: true,
        result: { userId: updated.id, status: updated.status, unlocked: commandType === "unlock" },
      };
    }
  }

  if (targetType === "reservation" && commandType === "cancel") {
    const updated = await prisma.reservation.update({
      where: { id: targetId },
      data: { status: "released" },
    });
    return {
      status: "applied",
      reversible: false,
      result: { reservationId: updated.id, status: updated.status },
    };
  }

  // Accepted stub for commands without a wired domain path yet
  return {
    status: "accepted",
    reversible: false,
    result: {
      deferred: true,
      message: `Command ${commandType} on ${targetType} recorded; domain effect deferred`,
    },
  };
}

export async function executeOperationCommand(params: {
  input: unknown;
  actorUserId: string;
  platformRoles: readonly Role[];
}): Promise<ApiResponse<OperationCommandRecord>> {
  try {
    ensureRequestContext({
      operation: "ops.command",
      module: "operations",
    });
    enrichRequestContext({ userId: params.actorUserId });

    if (isReadOnlyOps(params.platformRoles)) {
      throw new AppError("FORBIDDEN", "Auditor role is read-only", 403);
    }

    const parsed = executeOperationCommandSchema.parse(params.input);
    const queueKey = inferQueue(parsed.targetType, parsed.queueKey);

    if (
      !canExecuteCommand({
        platformRoles: params.platformRoles,
        commandType: parsed.commandType,
        queueKey,
      })
    ) {
      throw new AppError("FORBIDDEN", "Insufficient ops command permission", 403);
    }

    if (parsed.playbookKey && !isPlaybookKey(parsed.playbookKey)) {
      throw new AppError("INVALID_PLAYBOOK", "Unknown playbook key", 400);
    }

    const existing = await prisma.operationalCommand.findUnique({
      where: { idempotencyKey: parsed.idempotencyKey },
    });
    if (existing) {
      return apiSuccess({
        id: existing.id,
        publicId: existing.publicId,
        commandType: existing.commandType as OperationCommandType,
        targetType: existing.targetType as OperationCommandTarget,
        targetId: existing.targetId,
        status: existing.status as OperationCommandStatus,
        reversible: existing.reversible,
      });
    }

    const effect = await applyDomainEffect({
      commandType: parsed.commandType,
      targetType: parsed.targetType,
      targetId: parsed.targetId,
      actorUserId: params.actorUserId,
      payload: parsed.payload,
    });

    const publicId = await generatePublicId("operation");

    const command = await prisma.$transaction(async (tx) => {
      const row = await tx.operationalCommand.create({
        data: {
          publicId,
          commandType: parsed.commandType,
          targetType: parsed.targetType,
          targetId: parsed.targetId,
          targetPublicId: parsed.targetPublicId ?? null,
          queueKey,
          status: effect.status,
          actorUserId: params.actorUserId,
          reason: parsed.reason ?? null,
          payload: (parsed.payload ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          result: effect.result as Prisma.InputJsonValue,
          playbookKey: parsed.playbookKey ?? null,
          reversible: effect.reversible,
          idempotencyKey: parsed.idempotencyKey,
          appliedAt:
            effect.status === "applied" || effect.status === "accepted"
              ? new Date()
              : null,
        },
      });

      await tx.operationalAudit.create({
        data: {
          commandId: row.id,
          actorUserId: params.actorUserId,
          action: `ops.${parsed.commandType}`,
          resourceType: parsed.targetType,
          resourceId: parsed.targetId,
          resourcePublicId: parsed.targetPublicId ?? null,
          queueKey,
          metadata: {
            publicId: row.publicId,
            status: effect.status,
            playbookKey: parsed.playbookKey ?? null,
            result: effect.result,
            correlationId: getCorrelationId() ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      return row;
    });

    logger.info("Operation command executed", {
      span: "ops.command",
      publicId: command.publicId,
      commandType: command.commandType,
      status: command.status,
    });

    return apiSuccess({
      id: command.id,
      publicId: command.publicId,
      commandType: command.commandType as OperationCommandType,
      targetType: command.targetType as OperationCommandTarget,
      targetId: command.targetId,
      status: command.status as OperationCommandStatus,
      reversible: command.reversible,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "OPERATION_COMMAND_FAILED",
      error instanceof Error ? error.message : "Could not execute command",
    );
  }
}
