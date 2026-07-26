/**
 * Operational queue management — list items for ops workflows.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import {
  OPERATIONAL_QUEUE_KEYS,
  type OperationalQueueKey,
} from "@/constants/operations";
import type { Role } from "@/constants/roles";
import { canManageQueues } from "@/features/admin/services/rbac-operations";
import { playbooksForQueue } from "@/features/admin/services/playbooks";
import { z } from "zod";

export type QueueItem = {
  id: string;
  publicId: string | null;
  status: string;
  createdAt: string;
  summary: string;
};

export type OperationalQueue = {
  key: OperationalQueueKey;
  size: number;
  items: QueueItem[];
  playbooks: Array<{ key: string; title: string }>;
};

export const listQueueSchema = z.object({
  queue: z.enum(OPERATIONAL_QUEUE_KEYS),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function listOperationalQueue(params: {
  input: unknown;
  platformRoles: readonly Role[];
}): Promise<ApiResponse<OperationalQueue>> {
  try {
    if (!canManageQueues(params.platformRoles)) {
      throw new AppError("FORBIDDEN", "Missing ops.queues.manage", 403);
    }
    const parsed = listQueueSchema.parse(params.input);
    const limit = parsed.limit ?? 25;
    const playbooks = playbooksForQueue(parsed.queue).map((p) => ({
      key: p.key,
      title: p.title,
    }));

    switch (parsed.queue) {
      case "review": {
        const rows = await prisma.reviewQueueItem.findMany({
          where: {
            status: { in: ["pending", "assigned", "in_review", "escalated"] },
          },
          orderBy: { createdAt: "asc" },
          take: limit,
          include: { submission: { select: { publicId: true } } },
        });
        return apiSuccess({
          key: parsed.queue,
          size: rows.length,
          playbooks,
          items: rows.map((r) => ({
            id: r.id,
            publicId: r.submission.publicId,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            summary: `Review ${r.status} · ${r.submission.publicId}`,
          })),
        });
      }
      case "settlement": {
        const rows = await prisma.settlement.findMany({
          where: {
            status: { in: ["pending", "scheduled", "processing", "failed"] },
          },
          orderBy: { createdAt: "asc" },
          take: limit,
        });
        return apiSuccess({
          key: parsed.queue,
          size: rows.length,
          playbooks,
          items: rows.map((r) => ({
            id: r.id,
            publicId: r.publicId,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            summary: `Settlement ${r.publicId} · ${r.status}`,
          })),
        });
      }
      case "withdrawal": {
        const rows = await prisma.withdrawalRequest.findMany({
          where: {
            status: {
              in: [
                "pending",
                "pending_approval",
                "approved",
                "scheduled",
                "processing",
                "failed",
              ],
            },
          },
          orderBy: { createdAt: "asc" },
          take: limit,
        });
        return apiSuccess({
          key: parsed.queue,
          size: rows.length,
          playbooks,
          items: rows.map((r) => ({
            id: r.id,
            publicId: r.publicId,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            summary: `Withdrawal ${r.publicId} · ${r.status}`,
          })),
        });
      }
      case "notification": {
        const rows = await prisma.notificationJob.findMany({
          where: { status: { in: ["scheduled", "queued", "failed"] } },
          orderBy: { scheduledAt: "asc" },
          take: limit,
          include: { intent: { select: { publicId: true, event: true } } },
        });
        return apiSuccess({
          key: parsed.queue,
          size: rows.length,
          playbooks,
          items: rows.map((r) => ({
            id: r.id,
            publicId: r.intent.publicId,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            summary: `${r.intent.event} · ${r.channel} · ${r.status}`,
          })),
        });
      }
      case "payment": {
        const rows = await prisma.paymentIntent.findMany({
          where: {
            status: {
              in: ["awaiting_payment", "pending_provider", "failed"],
            },
          },
          orderBy: { createdAt: "asc" },
          take: limit,
        });
        return apiSuccess({
          key: parsed.queue,
          size: rows.length,
          playbooks,
          items: rows.map((r) => ({
            id: r.id,
            publicId: r.publicId,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            summary: `Payment ${r.publicId} · ${r.status}`,
          })),
        });
      }
      case "moderation": {
        const rows = await prisma.user.findMany({
          where: { status: "suspended" },
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            suspendedAt: true,
          },
        });
        return apiSuccess({
          key: parsed.queue,
          size: rows.length,
          playbooks,
          items: rows.map((r) => ({
            id: r.id,
            publicId: null,
            status: r.status,
            createdAt: (r.suspendedAt ?? r.createdAt).toISOString(),
            summary: `Suspended user ${r.email ?? r.id}`,
          })),
        });
      }
    }
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "QUEUE_LIST_FAILED",
      error instanceof Error ? error.message : "Could not list queue",
    );
  }
}
