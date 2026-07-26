import type { PrismaClient } from "../../lib/generated/prisma/client";
import { PERMISSIONS } from "../../constants/permissions";

export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      create: {
        key,
        description: `Permission: ${key}`,
      },
      update: {
        description: `Permission: ${key}`,
      },
    });
  }
}
