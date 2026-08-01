/**
 * Bootstrap TrustProfiles for existing users using current calculators.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { recalculate } from "@/lib/trust/trust-profile-service";
import { recordEvent } from "@/lib/trust/trust-profile-service";
import type { TrustSubjectType } from "@/lib/trust/types";

export async function bootstrapTrustProfiles(params?: {
  limit?: number;
  subjectType?: TrustSubjectType;
  offset?: number;
}): Promise<{ bootstrapped: number; skipped: number }> {
  const subjectType = params?.subjectType ?? "worker";
  const limit = params?.limit ?? 500;
  const offset = params?.offset ?? 0;

  // Workers = users with assignments or workerPublicId
  const users = await prisma.user.findMany({
    where:
      subjectType === "worker"
        ? {
            OR: [
              { profile: { workerPublicId: { not: null } } },
              { assignments: { some: {} } },
            ],
          }
        : undefined,
    select: { id: true },
    take: limit,
    skip: offset,
    orderBy: { createdAt: "asc" },
  });

  let bootstrapped = 0;
  let skipped = 0;

  for (const user of users) {
    const existing = await prisma.trustProfile.findUnique({
      where: {
        subjectType_subjectId: {
          subjectType,
          subjectId: user.id,
        },
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await recalculate({ subjectType, subjectId: user.id });
    await recordEvent({
      subjectType,
      subjectId: user.id,
      eventType: "bootstrap",
      idempotencyKey: `bootstrap:${subjectType}:${user.id}`,
      payload: { source: "phase_4_2b_migration" },
      deferRecalc: true,
    });
    // Mark bootstrap event processed without second full recalc
    await prisma.trustEvent.updateMany({
      where: { idempotencyKey: `bootstrap:${subjectType}:${user.id}` },
      data: { status: "processed", processedAt: new Date() },
    });
    bootstrapped += 1;
  }

  return { bootstrapped, skipped };
}
