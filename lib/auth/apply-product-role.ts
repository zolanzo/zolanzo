import "server-only";

import { prisma } from "@/lib/prisma/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/validation/env";
import {
  jwtAppMetadataRoles,
  mergeWorkerClientRoleKeys,
  productRoleFromRbac,
  signupRoleToParticipation,
  type SignupProductRole,
} from "@/lib/auth/product-identity";

export async function applySignupProductRole(params: {
  userId: string;
  authSubject: string | null;
  role: SignupProductRole;
}): Promise<{
  participation: "worker" | "client";
  roleKeys: string[];
  jwtRoles: string[];
}> {
  const participation = signupRoleToParticipation(params.role);
  const existing = await prisma.userRole.findMany({
    where: { userId: params.userId },
    include: { role: { select: { key: true } } },
  });
  const existingKeys = existing.map((row) => row.role.key);
  const nextKeys = mergeWorkerClientRoleKeys(existingKeys, params.role);

  const wantedRoles = await prisma.role.findMany({
    where: { key: { in: nextKeys } },
  });
  if (wantedRoles.length !== nextKeys.length) {
    throw new Error("Platform roles are not seeded.");
  }

  const nextKeySet = new Set(nextKeys);
  const removeRoleIds = existing
    .filter((row) => !nextKeySet.has(row.role.key))
    .map((row) => row.roleId);
  const have = new Set(existingKeys);
  const toAdd = wantedRoles.filter((role) => !have.has(role.key));

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: params.userId },
      data: { participation },
    });
    if (removeRoleIds.length > 0) {
      await tx.userRole.deleteMany({
        where: { userId: params.userId, roleId: { in: removeRoleIds } },
      });
    }
    if (toAdd.length > 0) {
      await tx.userRole.createMany({
        data: toAdd.map((role) => ({
          userId: params.userId,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });
    }
  });

  const jwtRoles = jwtAppMetadataRoles(
    productRoleFromRbac({ participation, roleKeys: nextKeys }),
  );

  if (params.authSubject && isServiceRoleConfigured()) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.getUserById(params.authSubject);
    await admin.auth.admin.updateUserById(params.authSubject, {
      app_metadata: {
        ...(data.user?.app_metadata ?? {}),
        roles: jwtRoles,
      },
    });
  }

  return { participation, roleKeys: nextKeys, jwtRoles };
}
