/**
 * Seed-time public IDs using the same formats as lib/public-id/generator.
 * Avoids importing that module (it is server-only).
 */

import type { PrismaClient } from "../../lib/generated/prisma/client";
import {
  PUBLIC_ID_DEFINITIONS,
  type PublicIdEntity,
} from "../../constants/public-ids";
import {
  counterKeyFor,
  formatDateSequentialPublicId,
  formatRandomPublicId,
  formatSequentialPublicId,
  formatUtcDateCompact,
  formatUtcYear,
  formatYearSequentialPublicId,
  randomPublicSegment,
} from "../../lib/public-id/format";

type SeedDb = Pick<
  PrismaClient,
  "publicIdCounter" | "organization" | "profile" | "taskTemplate" | "campaign"
>;

async function nextSequence(
  entity: PublicIdEntity,
  key: string,
  db: SeedDb,
): Promise<number> {
  const row = await db.publicIdCounter.upsert({
    where: { key },
    create: { key, entity, value: 1 },
    update: { value: { increment: 1 } },
  });
  return row.value;
}

export async function seedGeneratePublicId(
  entity: PublicIdEntity,
  db: SeedDb,
  isTaken?: (publicId: string) => Promise<boolean>,
): Promise<string> {
  const def = PUBLIC_ID_DEFINITIONS[entity];
  const now = new Date();
  const maxAttempts = 8;

  switch (def.strategy) {
    case "random": {
      const length = def.randomLength ?? 6;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const candidate = formatRandomPublicId(
          entity,
          randomPublicSegment(length),
        );
        if (isTaken && (await isTaken(candidate))) continue;
        return candidate;
      }
      throw new Error(`Could not allocate unique public id for ${entity}`);
    }
    case "sequential": {
      const key = counterKeyFor(entity, now);
      const seq = await nextSequence(entity, key, db);
      return formatSequentialPublicId(entity, seq);
    }
    case "year_sequential": {
      const year = formatUtcYear(now);
      const key = counterKeyFor(entity, now);
      const seq = await nextSequence(entity, key, db);
      return formatYearSequentialPublicId(entity, year, seq);
    }
    case "date_sequential": {
      const dateKey = formatUtcDateCompact(now);
      const key = counterKeyFor(entity, now);
      const seq = await nextSequence(entity, key, db);
      return formatDateSequentialPublicId(entity, dateKey, seq);
    }
    default: {
      const _exhaustive: never = def.strategy;
      return _exhaustive;
    }
  }
}

export async function seedAllocateOrganizationPublicId(
  db: SeedDb,
): Promise<string> {
  return seedGeneratePublicId("organization", db, async (publicId) => {
    const existing = await db.organization.findUnique({
      where: { publicId },
      select: { id: true },
    });
    return Boolean(existing);
  });
}

export async function seedAllocateWorkerPublicId(db: SeedDb): Promise<string> {
  return seedGeneratePublicId("worker", db, async (publicId) => {
    const existing = await db.profile.findUnique({
      where: { workerPublicId: publicId },
      select: { id: true },
    });
    return Boolean(existing);
  });
}

export async function seedAllocateClientPublicId(db: SeedDb): Promise<string> {
  return seedGeneratePublicId("client", db, async (publicId) => {
    const existing = await db.profile.findUnique({
      where: { clientPublicId: publicId },
      select: { id: true },
    });
    return Boolean(existing);
  });
}
