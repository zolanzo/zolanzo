"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import { requirePermission } from "@/lib/rbac/guards";
import {
  getCommandCenter,
  type CommandCenterSnapshot,
} from "@/features/admin/services/command-center";
import {
  getAllOperationalViews,
  getOperationalView,
} from "@/features/admin/services/views-service";
import { listOperationalQueue } from "@/features/admin/services/queues";
import { searchAuditExplorer } from "@/features/admin/services/audit-explorer";
import { executeOperationCommand } from "@/features/admin/services/operation-commands";
import { getHealthDashboard } from "@/features/admin/services/health";
import { BUILTIN_PLAYBOOKS } from "@/features/admin/services/playbooks";
import type { OperationalView } from "@/features/admin/services/operational-views";
import type { OperationalViewKey } from "@/constants/operations";
import type { OperationCommandRecord } from "@/features/admin/services/operation-commands";
import type { OperationalQueue } from "@/features/admin/services/queues";
import type { AuditExplorerHit } from "@/features/admin/services/audit-explorer";
import type { HealthDashboard } from "@/features/admin/services/health";
import { withServerRequestContext } from "@/lib/observability/with-server-context";

export async function getCommandCenterAction(): Promise<
  ApiResponse<CommandCenterSnapshot>
> {
  const ctx = await requirePermission("ops.command_center.read");
  return getCommandCenter({ platformRoles: ctx.user.platformRoles });
}

export async function getOperationalViewAction(
  view: OperationalViewKey,
): Promise<ApiResponse<OperationalView>> {
  const ctx = await requirePermission("ops.views.read");
  return getOperationalView({
    input: { view },
    platformRoles: ctx.user.platformRoles,
  });
}

export async function getAllOperationalViewsAction(): Promise<
  ApiResponse<Record<OperationalViewKey, OperationalView>>
> {
  const ctx = await requirePermission("ops.views.read");
  return getAllOperationalViews({ platformRoles: ctx.user.platformRoles });
}

export async function listOperationalQueueAction(
  input: unknown,
): Promise<ApiResponse<OperationalQueue>> {
  const ctx = await requirePermission("ops.queues.manage");
  return listOperationalQueue({
    input,
    platformRoles: ctx.user.platformRoles,
  });
}

export async function searchAuditExplorerAction(
  input: unknown,
): Promise<ApiResponse<{ hits: AuditExplorerHit[]; total: number }>> {
  const ctx = await requirePermission("ops.audit.read");
  return searchAuditExplorer({
    input,
    platformRoles: ctx.user.platformRoles,
  });
}

export async function executeOperationCommandAction(
  input: unknown,
): Promise<ApiResponse<OperationCommandRecord>> {
  const ctx = await requirePermission("ops.commands.execute");
  return withServerRequestContext(
    {
      operation: "ops.command",
      module: "operations",
      userId: ctx.user.id,
      organizationId: ctx.user.activeOrganizationId ?? undefined,
    },
    () =>
      executeOperationCommand({
        input,
        actorUserId: ctx.user.id,
        platformRoles: ctx.user.platformRoles,
      }),
  );
}

export async function getHealthDashboardAction(): Promise<
  ApiResponse<HealthDashboard>
> {
  await requirePermission("ops.health.read");
  const health = await getHealthDashboard();
  return { ok: true as const, data: health };
}

export async function listPlaybooksAction(): Promise<
  ApiResponse<typeof BUILTIN_PLAYBOOKS>
> {
  await requirePermission("ops.playbooks.read");
  await requireAuthContext();
  return { ok: true as const, data: BUILTIN_PLAYBOOKS };
}
