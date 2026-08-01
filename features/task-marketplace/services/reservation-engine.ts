import "server-only";

import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/api/response";
import { DEFAULT_RESERVATION_TIMEOUT_SECONDS } from "@/constants/claim-policies";
import {
  reservationRepository,
} from "@/features/assignments/repositories";
import type { ReservationRecord } from "@/features/assignments/types";

/**
 * Atomically reserve an available Task Instance for a worker.
 */
export async function reserveTaskInstance(params: {
  taskInstanceId: string;
  workerUserId: string;
  campaignId: string;
  timeoutSeconds?: number;
}): Promise<ReservationRecord> {
  const timeoutSeconds =
    params.timeoutSeconds ?? DEFAULT_RESERVATION_TIMEOUT_SECONDS;
  const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.taskInstance.updateMany({
        where: {
          id: params.taskInstanceId,
          status: "available",
          reserved: false,
        },
        data: {
          status: "reserved",
          reserved: true,
          reservedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new AppError(
          "INVENTORY_UNAVAILABLE",
          "Work opportunity is no longer available",
          409,
        );
      }

      const row = await tx.reservation.create({
        data: {
          taskInstanceId: params.taskInstanceId,
          workerUserId: params.workerUserId,
          campaignId: params.campaignId,
          status: "pending",
          timeoutSeconds,
          expiresAt,
        },
      });

      return {
        id: row.id,
        taskInstanceId: row.taskInstanceId,
        workerUserId: row.workerUserId,
        campaignId: row.campaignId,
        status: row.status as ReservationRecord["status"],
        timeoutSeconds: row.timeoutSeconds,
        expiresAt: row.expiresAt.toISOString(),
        confirmedAt: null,
        releasedAt: null,
        expiredAt: null,
        convertedAt: null,
        metadata: null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "RESERVE_FAILED",
      error instanceof Error ? error.message : "Could not reserve opportunity",
      500,
    );
  }
}

/**
 * Expire pending reservations and return inventory to available.
 */
export async function expireReservations(
  now = new Date(),
): Promise<{ expired: number }> {
  const pending = await reservationRepository.listExpiredPending(now);
  let expired = 0;

  for (const reservation of pending) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.reservation.findUnique({
        where: { id: reservation.id },
      });
      if (!current || current.status !== "pending") return;

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "expired", expiredAt: now },
      });

      await tx.taskInstance.updateMany({
        where: {
          id: reservation.taskInstanceId,
          status: "reserved",
        },
        data: {
          status: "available",
          reserved: false,
          reservedAt: null,
        },
      });
      expired += 1;
    });
  }

  return { expired };
}

export async function releaseReservation(params: {
  reservationId: string;
  workerUserId: string;
}): Promise<ReservationRecord> {
  const reservation = await reservationRepository.findById(params.reservationId);
  if (!reservation) {
    throw new AppError("NOT_FOUND", "Reservation not found", 404);
  }
  if (reservation.workerUserId !== params.workerUserId) {
    throw new AppError("FORBIDDEN", "Reservation belongs to another worker", 403);
  }
  return releaseReservationAtomic({
    reservationId: params.reservationId,
    taskInstanceId: reservation.taskInstanceId,
    expectedStatus: "pending",
  });
}

/**
 * Ops / system release — restores inventory without worker ownership check.
 * Only pending reservations are releasable (confirmed implies claim in progress).
 */
export async function forceReleaseReservation(params: {
  reservationId: string;
}): Promise<ReservationRecord> {
  const reservation = await reservationRepository.findById(params.reservationId);
  if (!reservation) {
    throw new AppError("NOT_FOUND", "Reservation not found", 404);
  }
  if (reservation.status !== "pending") {
    throw new AppError(
      "RESERVATION_NOT_PENDING",
      `Reservation status is ${reservation.status}`,
      409,
    );
  }
  return releaseReservationAtomic({
    reservationId: params.reservationId,
    taskInstanceId: reservation.taskInstanceId,
    expectedStatus: "pending",
  });
}

async function releaseReservationAtomic(params: {
  reservationId: string;
  taskInstanceId: string;
  expectedStatus: "pending";
}): Promise<ReservationRecord> {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.updateMany({
      where: {
        id: params.reservationId,
        status: params.expectedStatus,
      },
      data: { status: "released", releasedAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new AppError(
        "RESERVATION_RACE",
        "Reservation was already released or changed",
        409,
      );
    }
    await tx.taskInstance.updateMany({
      where: {
        id: params.taskInstanceId,
        status: "reserved",
      },
      data: { status: "available", reserved: false, reservedAt: null },
    });
  });

  const updated = await reservationRepository.findById(params.reservationId);
  if (!updated) {
    throw new AppError("NOT_FOUND", "Reservation not found after release", 404);
  }
  return updated;
}
