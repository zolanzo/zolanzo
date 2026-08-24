import "server-only";

import { prisma } from "@/lib/prisma/client";
import { readOpportunityPreferences } from "@/lib/profile/address-json";
import type { WorkerEligibilityContext } from "@/features/task-marketplace/types/worker-context";

/**
 * Build eligibility context from the live worker profile.
 * Does not invent country, platforms, or scores.
 */
export async function loadWorkerEligibilityContext(params: {
  userId: string;
  organizationIds: string[];
}): Promise<WorkerEligibilityContext> {
  const [profile, trust, completed] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: params.userId },
      select: { countryCode: true, addressJson: true },
    }),
    prisma.trustProfile.findFirst({
      where: { userId: params.userId },
      orderBy: { lastCalculatedAt: "desc" },
      select: { overallScore: true },
    }),
    prisma.assignment.count({
      where: {
        workerUserId: params.userId,
        status: { in: ["completed", "approved"] },
      },
    }),
  ]);

  const preferences = readOpportunityPreferences(profile?.addressJson);

  return {
    userId: params.userId,
    countryCode: profile?.countryCode ?? null,
    languages: [],
    skills: [],
    platforms: preferences.preferredPlatforms,
    devices: [],
    trustScore:
      typeof trust?.overallScore === "number" ? trust.overallScore : 50,
    approvalRate: 1,
    completedTasks: completed,
    organizationIds: params.organizationIds,
  };
}
