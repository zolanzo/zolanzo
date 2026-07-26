/**
 * Operations RBAC helpers — which roles may execute which command families.
 */

import type { Permission } from "@/constants/permissions";
import { rolesHavePermission } from "@/constants/permissions";
import type { Role } from "@/constants/roles";
import { hasPlatformRole } from "@/lib/rbac/access";
import type {
  OperationCommandType,
  OperationalQueueKey,
  OperationsRole,
} from "@/constants/operations";
import { OPERATIONS_ROLES } from "@/constants/operations";

export function isOperationsRole(role: Role): role is OperationsRole {
  return (OPERATIONS_ROLES as readonly string[]).includes(role);
}

export function operationsRolesFrom(
  platformRoles: readonly Role[],
): OperationsRole[] {
  return platformRoles.filter(isOperationsRole);
}

/** Permission required to execute a command type. */
export function permissionForCommand(
  commandType: OperationCommandType,
): Permission {
  switch (commandType) {
    case "approve":
    case "reject":
    case "cancel":
      return "ops.finance.act";
    case "suspend":
    case "resume":
    case "unlock":
      return "ops.moderation.act";
    case "archive":
    case "escalate":
    case "retry":
    case "requeue":
    default:
      return "ops.commands.execute";
  }
}

export function canExecuteCommand(params: {
  platformRoles: readonly Role[];
  commandType: OperationCommandType;
  queueKey?: OperationalQueueKey | null;
}): boolean {
  const elevated = hasPlatformRole(params.platformRoles, [
    "super_admin",
    "admin",
  ]);

  if (rolesHavePermission(params.platformRoles, "ops.commands.execute")) {
    if (
      params.queueKey === "withdrawal" ||
      params.queueKey === "settlement" ||
      params.queueKey === "payment"
    ) {
      return (
        elevated ||
        rolesHavePermission(params.platformRoles, "ops.finance.act")
      );
    }
    if (params.queueKey === "moderation") {
      return (
        elevated ||
        rolesHavePermission(params.platformRoles, "ops.moderation.act")
      );
    }
    return true;
  }

  return rolesHavePermission(
    params.platformRoles,
    permissionForCommand(params.commandType),
  );
}

export function canReadCommandCenter(
  platformRoles: readonly Role[],
): boolean {
  return rolesHavePermission(platformRoles, "ops.command_center.read");
}

export function canReadAudit(platformRoles: readonly Role[]): boolean {
  return rolesHavePermission(platformRoles, "ops.audit.read");
}

export function canManageQueues(platformRoles: readonly Role[]): boolean {
  return rolesHavePermission(platformRoles, "ops.queues.manage");
}

/** Auditor is read-only — cannot execute commands. */
export function isReadOnlyOps(platformRoles: readonly Role[]): boolean {
  const ops = operationsRolesFrom(platformRoles);
  if (ops.includes("super_admin") || ops.includes("admin")) return false;
  return ops.length > 0 && ops.every((r) => r === "auditor");
}
