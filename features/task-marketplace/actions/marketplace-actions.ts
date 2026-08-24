"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type { AssignmentRecord } from "@/features/assignments/types";
import type { ReservationRecord } from "@/features/assignments/types";
import type {
  MarketplaceAnalytics,
  MarketplacePage,
  WorkOpportunity,
} from "@/features/task-marketplace/types";
import {
  browseWorkOpportunities,
  claimWorkOpportunity,
  confirmClaim,
  getMarketplaceAnalytics,
  getWorkOpportunityByPublicId,
  reserveWorkOpportunity,
} from "@/features/task-marketplace/services";
import { expireReservations } from "@/features/task-marketplace/services/reservation-engine";
import { loadWorkerEligibilityContext } from "@/features/task-marketplace/services/worker-context";
import { prisma } from "@/lib/prisma/client";
import { assignmentRepository, reservationRepository } from "@/features/assignments/repositories";
import { apiSuccess } from "@/lib/api/response";
import {
  claimOpportunitySchema,
  reserveOpportunitySchema,
} from "@/features/task-marketplace/validators";

export async function browseMarketplaceAction(
  input: unknown,
): Promise<ApiResponse<MarketplacePage>> {
  await requireAuthContext();
  return browseWorkOpportunities({ input });
}

export async function getOpportunityAction(
  publicId: string,
): Promise<ApiResponse<WorkOpportunity>> {
  await requireAuthContext();
  return getWorkOpportunityByPublicId(publicId);
}

export async function reserveWorkAction(
  input: unknown,
): Promise<ApiResponse<ReservationRecord>> {
  const ctx = await requireAuthContext();
  const parsed = reserveOpportunitySchema.parse(input);
  const worker = await loadWorkerEligibilityContext({
    userId: ctx.user.id,
    organizationIds: ctx.user.activeOrganizationId
      ? [ctx.user.activeOrganizationId]
      : ctx.user.memberships
          .filter((m) => m.status === "active")
          .map((m) => m.organizationId),
  });
  return reserveWorkOpportunity({
    input: {
      instancePublicId: parsed.instancePublicId,
      worker,
    },
  });
}

export async function confirmClaimAction(
  reservationId: string,
): Promise<ApiResponse<AssignmentRecord>> {
  const ctx = await requireAuthContext();
  return confirmClaim({
    input: { reservationId, workerUserId: ctx.user.id },
  });
}

export async function claimWorkAction(
  input: unknown,
): Promise<
  ApiResponse<{ reservation: ReservationRecord; assignment: AssignmentRecord }>
> {
  const ctx = await requireAuthContext();
  const parsed = claimOpportunitySchema.parse(input);
  const worker = await loadWorkerEligibilityContext({
    userId: ctx.user.id,
    organizationIds: ctx.user.activeOrganizationId
      ? [ctx.user.activeOrganizationId]
      : ctx.user.memberships
          .filter((m) => m.status === "active")
          .map((m) => m.organizationId),
  });
  return claimWorkOpportunity({
    input: {
      instancePublicId: parsed.instancePublicId,
      worker,
    },
  });
}

export async function startOpportunityAction(
  instancePublicId: string,
): Promise<
  ApiResponse<{ reservation: ReservationRecord; assignment: AssignmentRecord }>
> {
  const ctx = await requireAuthContext();
  const instance = await prisma.taskInstance.findFirst({
    where: { publicId: instancePublicId },
    select: { id: true },
  });
  if (instance) {
    const existing = await assignmentRepository.findByTaskInstanceId(instance.id);
    if (existing && existing.workerUserId === ctx.user.id) {
      const reservation = await reservationRepository.findById(
        existing.reservationId,
      );
      if (reservation) {
        return apiSuccess({ reservation, assignment: existing });
      }
    }
  }
  const worker = await loadWorkerEligibilityContext({
    userId: ctx.user.id,
    organizationIds: ctx.user.activeOrganizationId
      ? [ctx.user.activeOrganizationId]
      : ctx.user.memberships
          .filter((m) => m.status === "active")
          .map((m) => m.organizationId),
  });
  return claimWorkOpportunity({
    input: {
      instancePublicId,
      worker,
    },
  });
}

export async function marketplaceAnalyticsAction(): Promise<
  ApiResponse<MarketplaceAnalytics>
> {
  await requireAuthContext();
  return getMarketplaceAnalytics();
}

export async function expireReservationsAction(): Promise<
  ApiResponse<{ expired: number }>
> {
  await requireAuthContext();
  const result = await expireReservations();
  return { ok: true, data: result };
}
