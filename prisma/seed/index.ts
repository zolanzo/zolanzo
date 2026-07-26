/**
 * Seed entry — permissions, default roles, feature flags only.
 */

import "dotenv/config";

import { PrismaClient } from "../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedFeatureFlags } from "./feature-flags";
import { seedPermissions } from "./permissions";
import { seedRoles } from "./roles";

function createSeedClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.DIRECT_URL ??
    "postgresql://localhost:5432/zolanzo";

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  const prisma = createSeedClient();

  try {
    await seedPermissions(prisma);
    await seedRoles(prisma);
    await seedFeatureFlags(prisma);
    const { seedTaskTemplates } = await import("./task-templates");
    await seedTaskTemplates(prisma);
    const { seedCampaigns } = await import("./campaigns");
    await seedCampaigns(prisma);
    const { seedTaskInstances } = await import("./task-instances");
    await seedTaskInstances(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Seed failed: ${message}\n`);
  process.exit(1);
});
