import "server-only";

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/observability/logger";
import type { Prisma } from "@/lib/generated/prisma/client";

export type AuditWriteInput = {
  actorUserId?: string | null;
  actorType?: "user" | "system" | "admin" | "api";
  organizationId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
};

/**
 * Persist an audit row. Never throws to callers — auth must not fail on audit.
 */
export async function writeAuditLog(input: AuditWriteInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        actorType: input.actorType ?? "user",
        organizationId: input.organizationId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata,
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    logger.error("Failed to write audit log", {
      span: "audit.write",
      action: input.action,
      err:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: String(error) },
    });
  }
}
