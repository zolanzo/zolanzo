import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import {
  PUBLIC_ID_DEFINITIONS,
  type PublicIdEntity,
} from "@/constants/public-ids";
import {
  counterKeyFor,
  formatDateSequentialPublicId,
  formatRandomPublicId,
  formatSequentialPublicId,
  formatUtcDateCompact,
  formatUtcYear,
  formatYearSequentialPublicId,
  randomPublicSegment,
} from "@/lib/public-id/format";
import { AppError } from "@/lib/api/response";

type DbClient = Pick<
  PrismaClient,
  "publicIdCounter" | "organization" | "profile"
> &
  Partial<Pick<PrismaClient, "taskTemplate" | "campaign">>;

export type PublicIdGeneratorOptions = {
  now?: Date;
  maxAttempts?: number;
  isTaken?: (publicId: string) => Promise<boolean>;
  db?: DbClient;
};

async function nextSequence(
  entity: PublicIdEntity,
  key: string,
  db: DbClient,
): Promise<number> {
  const row = await db.publicIdCounter.upsert({
    where: { key },
    create: { key, entity, value: 1 },
    update: { value: { increment: 1 } },
  });
  return row.value;
}

/**
 * Central Public ID Generator — only entry point for public identifiers.
 */
export async function generatePublicId(
  entity: PublicIdEntity,
  options: PublicIdGeneratorOptions = {},
): Promise<string> {
  const def = PUBLIC_ID_DEFINITIONS[entity];
  const now = options.now ?? new Date();
  const maxAttempts = options.maxAttempts ?? 8;
  const db = options.db ?? prisma;

  switch (def.strategy) {
    case "random": {
      const length = def.randomLength ?? 6;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const candidate = formatRandomPublicId(
          entity,
          randomPublicSegment(length),
        );
        if (options.isTaken && (await options.isTaken(candidate))) {
          continue;
        }
        return candidate;
      }
      throw new AppError(
        "PUBLIC_ID_COLLISION",
        `Could not allocate unique public id for ${entity}`,
        500,
      );
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

export async function allocateOrganizationPublicId(
  db: DbClient = prisma,
): Promise<string> {
  return generatePublicId("organization", {
    db,
    isTaken: async (publicId) => {
      const existing = await db.organization.findUnique({
        where: { publicId },
        select: { id: true },
      });
      return Boolean(existing);
    },
  });
}

export async function allocateWorkerPublicId(
  db: DbClient = prisma,
): Promise<string> {
  return generatePublicId("worker", {
    db,
    isTaken: async (publicId) => {
      const existing = await db.profile.findUnique({
        where: { workerPublicId: publicId },
        select: { id: true },
      });
      return Boolean(existing);
    },
  });
}

export async function allocateClientPublicId(
  db: DbClient = prisma,
): Promise<string> {
  return generatePublicId("client", {
    db,
    isTaken: async (publicId) => {
      const existing = await db.profile.findUnique({
        where: { clientPublicId: publicId },
        select: { id: true },
      });
      return Boolean(existing);
    },
  });
}
