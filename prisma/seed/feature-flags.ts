import type { PrismaClient } from "../../lib/generated/prisma/client";
import {
  FEATURE_FLAGS,
  FEATURE_FLAG_PLAN_GATES,
} from "../../constants/feature-flags";

export async function seedFeatureFlags(prisma: PrismaClient): Promise<void> {
  for (const key of FEATURE_FLAGS) {
    const planGate = FEATURE_FLAG_PLAN_GATES[key] ?? null;
    await prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        description: `Feature flag: ${key}`,
        enabled: false,
        planGate,
      },
      update: {
        description: `Feature flag: ${key}`,
        planGate,
      },
    });
  }
}
