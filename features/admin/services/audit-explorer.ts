/**
 * Audit Explorer — search operational + platform audit trails.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import type { Role } from "@/constants/roles";
import { canReadAudit } from "@/features/admin/services/rbac-operations";
import { z } from "zod";

export type AuditExplorerHit = {
  source: "operational" | "platform";
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourcePublicId: string | null;
  actorUserId: string | null;
  organizationId: string | null;
  createdAt: string;
  metadata: unknown;
};

export const auditSearchSchema = z.object({
  publicId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  organizationId: z.string().min(1).optional(),
  campaignId: z.string().min(1).optional(),
  assignmentId: z.string().min(1).optional(),
  submissionId: z.string().min(1).optional(),
  ledgerTransactionId: z.string().min(1).optional(),
  operationType: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function searchAuditExplorer(params: {
  input: unknown;
  platformRoles: readonly Role[];
}): Promise<ApiResponse<{ hits: AuditExplorerHit[]; total: number }>> {
  try {
    if (!canReadAudit(params.platformRoles)) {
      throw new AppError("FORBIDDEN", "Missing ops.audit.read", 403);
    }
    const parsed = auditSearchSchema.parse(params.input);
    const limit = parsed.limit ?? 50;
    const createdAt: Prisma.DateTimeFilter | undefined =
      parsed.from || parsed.to
        ? {
            ...(parsed.from ? { gte: new Date(parsed.from) } : {}),
            ...(parsed.to ? { lte: new Date(parsed.to) } : {}),
          }
        : undefined;

    const publicId = parsed.publicId;
    const resourceIds = [
      parsed.campaignId,
      parsed.assignmentId,
      parsed.submissionId,
      parsed.ledgerTransactionId,
    ].filter((x): x is string => Boolean(x));

    const [ops, platform] = await Promise.all([
      prisma.operationalAudit.findMany({
        where: {
          ...(createdAt ? { createdAt } : {}),
          ...(parsed.userId ? { actorUserId: parsed.userId } : {}),
          ...(parsed.organizationId
            ? { organizationId: parsed.organizationId }
            : {}),
          ...(parsed.operationType
            ? { action: { contains: parsed.operationType } }
            : {}),
          ...(publicId
            ? {
                OR: [
                  { resourcePublicId: publicId },
                  { resourceId: publicId },
                ],
              }
            : {}),
          ...(resourceIds.length
            ? { resourceId: { in: resourceIds } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.auditLog.findMany({
        where: {
          ...(createdAt ? { createdAt } : {}),
          ...(parsed.userId ? { actorUserId: parsed.userId } : {}),
          ...(parsed.organizationId
            ? { organizationId: parsed.organizationId }
            : {}),
          ...(parsed.operationType
            ? { action: { contains: parsed.operationType } }
            : {}),
          ...(publicId || resourceIds.length
            ? {
                OR: [
                  ...(publicId ? [{ resourceId: publicId }] : []),
                  ...(resourceIds.length
                    ? [{ resourceId: { in: resourceIds } }]
                    : []),
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const hits: AuditExplorerHit[] = [
      ...ops.map((r) => ({
        source: "operational" as const,
        id: r.id,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        resourcePublicId: r.resourcePublicId,
        actorUserId: r.actorUserId,
        organizationId: r.organizationId,
        createdAt: r.createdAt.toISOString(),
        metadata: r.metadata,
      })),
      ...platform.map((r) => ({
        source: "platform" as const,
        id: r.id,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        resourcePublicId: null,
        actorUserId: r.actorUserId,
        organizationId: r.organizationId,
        createdAt: r.createdAt.toISOString(),
        metadata: r.metadata,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    return apiSuccess({ hits, total: hits.length });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "AUDIT_SEARCH_FAILED",
      error instanceof Error ? error.message : "Could not search audits",
    );
  }
}
