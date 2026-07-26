import type { PrismaClient } from "../../lib/generated/prisma/client";
import {
  ROLE_PERMISSIONS,
  type Permission,
} from "../../constants/permissions";
import { ROLE_HIERARCHY, ROLES, normalizeRole } from "../../constants/roles";

function permissionKeysForRole(roleKey: string): readonly Permission[] | "*" {
  const normalized = normalizeRole(
    roleKey as (typeof ROLES)[number],
  );
  return ROLE_PERMISSIONS[normalized];
}

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  for (const roleKey of ROLES) {
    if (roleKey === "advertiser") {
      // Deprecated alias — do not seed a separate role row
      continue;
    }

    const role = await prisma.role.upsert({
      where: { key: roleKey },
      create: {
        key: roleKey,
        name: roleKey
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        description: `Platform role: ${roleKey}`,
        hierarchy: ROLE_HIERARCHY[roleKey],
      },
      update: {
        hierarchy: ROLE_HIERARCHY[roleKey],
        description: `Platform role: ${roleKey}`,
      },
    });

    const grants = permissionKeysForRole(roleKey);

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    if (grants === "*") {
      const rows = allPermissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      }));
      if (rows.length > 0) {
        await prisma.rolePermission.createMany({ data: rows });
      }
      continue;
    }

    const rows = grants
      .map((key) => {
        const permissionId = permissionByKey.get(key);
        if (!permissionId) return null;
        return { roleId: role.id, permissionId };
      })
      .filter((row): row is { roleId: string; permissionId: string } =>
        Boolean(row),
      );

    if (rows.length > 0) {
      await prisma.rolePermission.createMany({ data: rows });
    }
  }
}
