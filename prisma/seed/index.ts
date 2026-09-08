/**
 * Development seed — permissions, roles, flags, templates, marketplace fixtures.
 * Bulk catalog campaigns that auto-activate are not run here; staff approval
 * must remain the path that creates marketplace inventory.
 */

import dotenv from "dotenv";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertDevelopmentSeedTarget } from "../../lib/dev/assert-dev-seed-target";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

function createSeedClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
  if (!connectionString) {
    throw new Error(
      "Abort seed: DATABASE_URL or DIRECT_URL is required after the development target check.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  assertDevelopmentSeedTarget();
  process.stdout.write("Seed target: zolanzo-dev\n");
  const prisma = createSeedClient();

  try {
    const { seedPermissions } = await import("./permissions");
    process.stdout.write("Seeding permissions...\n");
    await seedPermissions(prisma);
    const { seedRoles } = await import("./roles");
    process.stdout.write("Seeding roles...\n");
    await seedRoles(prisma);
    const { seedFeatureFlags } = await import("./feature-flags");
    process.stdout.write("Seeding feature flags...\n");
    await seedFeatureFlags(prisma);
    const { seedTaskTemplates } = await import("./task-templates");
    process.stdout.write("Seeding task templates...\n");
    await seedTaskTemplates(prisma);
    const { seedDevMarketplace } = await import("./dev-marketplace");
    process.stdout.write("Seeding marketplace fixtures...\n");
    await seedDevMarketplace(prisma);
    process.stdout.write("Seed complete.\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Seed failed: ${message}\n`);
  process.exit(1);
});
