"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type { AssignmentRecord } from "@/features/assignments/types";
import type { ReservationRecord } from "@/features/assignments/types";
import type {
  MarketplaceAnalytics,
  MarketplacePage,
} from "@/features/task-marketplace/types";
import {
  browseWorkOpportunities,
  claimWorkOpportunity,
  confirmClaim,
  getMarketplaceAnalytics,
  reserveWorkOpportunity,
} from "@/features/task-marketplace/services";
import { expireReservations } from "@/features/task-marketplace/services/reservation-engine";
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

export async function reserveWorkAction(
  input: unknown,
): Promise<ApiResponse<ReservationRecord>> {
  const ctx = await requireAuthContext();
  const parsed = reserveOpportunitySchema.parse(input);
  return reserveWorkOpportunity({
    input: {
      ...parsed,
      worker: { ...parsed.worker, userId: ctx.user.id },
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
  return claimWorkOpportunity({
    input: {
      ...parsed,
      worker: { ...parsed.worker, userId: ctx.user.id },
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
