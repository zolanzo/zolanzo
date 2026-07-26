/**
 * Command Center — live operations dashboard snapshot.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { collectOperationalMetrics } from "@/features/admin/services/metrics";
import {
  buildAllViews,
  buildQueueHealth,
  type OperationalView,
  type QueueHealthItem,
} from "@/features/admin/services/operational-views";
import { BUILTIN_PLAYBOOKS } from "@/features/admin/services/playbooks";
import { getHealthDashboard, type HealthDashboard } from "@/features/admin/services/health";
import type { Role } from "@/constants/roles";
import { canReadCommandCenter } from "@/features/admin/services/rbac-operations";

export type AttentionItem = {
  severity: "watch" | "breach";
  queue: string;
  message: string;
};

export type CommandCenterSnapshot = {
  generatedAt: string;
  overview: OperationalView;
  queues: QueueHealthItem[];
  attention: AttentionItem[];
  health: HealthDashboard;
  playbookHints: Array<{ key: string; title: string; queueKey: string }>;
  views: Record<string, OperationalView>;
};

function buildAttention(queues: QueueHealthItem[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const q of queues) {
    if (q.sla === "breach") {
      items.push({
        severity: "breach",
        queue: q.queue,
        message: `${q.queue} queue needs attention (${q.failed} failed, ${q.aged} aged, ${q.pending} pending)`,
      });
    } else if (q.sla === "watch") {
      items.push({
        severity: "watch",
        queue: q.queue,
        message: `${q.queue} queue elevated (${q.pending} pending)`,
      });
    }
  }
  return items;
}

export async function getCommandCenter(params: {
  platformRoles: readonly Role[];
  persistSnapshot?: boolean;
}): Promise<ApiResponse<CommandCenterSnapshot>> {
  try {
    if (!canReadCommandCenter(params.platformRoles)) {
      throw new AppError("FORBIDDEN", "Missing ops.command_center.read", 403);
    }

    const metrics = await collectOperationalMetrics();
    const views = buildAllViews(metrics);
    const queues = buildQueueHealth(metrics);
    const health = await getHealthDashboard();
    const snapshot: CommandCenterSnapshot = {
      generatedAt: new Date().toISOString(),
      overview: views.platform_overview,
      queues,
      attention: buildAttention(queues),
      health,
      playbookHints: BUILTIN_PLAYBOOKS.map((p) => ({
        key: p.key,
        title: p.title,
        queueKey: p.queueKey,
      })),
      views,
    };

    if (params.persistSnapshot !== false) {
      await prisma.dashboardSnapshot.upsert({
        where: { key: "command_center" },
        create: {
          key: "command_center",
          payload: snapshot as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
        update: {
          payload: snapshot as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
    }

    return apiSuccess(snapshot);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "COMMAND_CENTER_FAILED",
      error instanceof Error ? error.message : "Could not build command center",
    );
  }
}
