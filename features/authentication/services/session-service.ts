import "server-only";

import { prisma } from "@/lib/prisma/client";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/write";
import { sha256Hex } from "@/lib/auth/identity-helpers";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";
import { isDatabaseConfigured } from "@/lib/validation/env";

export async function listSessions(userId: string) {
  if (!isDatabaseConfigured()) return [];
  return prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export async function listDevices(userId: string) {
  if (!isDatabaseConfigured()) return [];
  return prisma.device.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      name: true,
      fingerprint: true,
      trustedAt: true,
      lastSeenAt: true,
    },
  });
}

export async function revokeSession(
  userId: string,
  sessionId: string,
): Promise<ApiResponse<{ revoked: true }>> {
  try {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });
    if (!session) {
      throw new AppError("NOT_FOUND", "Session not found", 404);
    }
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    await writeAuditLog({
      actorUserId: userId,
      action: "session.revoked",
      resourceType: "session",
      resourceId: sessionId,
      metadata: { scope: "single" },
    });
    return apiSuccess({ revoked: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("REVOKE_FAILED", "Could not revoke session");
  }
}

export async function revokeAllSessions(
  userId: string,
  keepCurrentAccessToken?: string,
): Promise<ApiResponse<{ revoked: number }>> {
  try {
    let keepHash: string | undefined;
    if (keepCurrentAccessToken) {
      keepHash = await sha256Hex(keepCurrentAccessToken);
    }

    const result = await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(keepHash ? { NOT: { tokenHash: keepHash } } : {}),
      },
      data: { revokedAt: new Date() },
    });

    await prisma.device.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Force Supabase global sign-out of other refresh tokens when possible
    const supabase = await createSupabaseServerActionClient();
    await supabase.auth.signOut({ scope: "global" });

    await writeAuditLog({
      actorUserId: userId,
      action: "session.revoked",
      resourceType: "session",
      metadata: { scope: "all", count: result.count },
    });

    return apiSuccess({ revoked: result.count });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("REVOKE_ALL_FAILED", "Could not revoke sessions");
  }
}
