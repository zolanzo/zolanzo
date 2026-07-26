import "server-only";

import { prisma } from "@/lib/prisma/client";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import type { TemplateConstraint } from "@/constants/constraints";
import { mergeEligibilityRules } from "@/features/campaigns/services/eligibility";
import { reservationRepository } from "@/features/assignments/repositories";
import { evaluateWorkerEligibility } from "@/features/task-marketplace/services/eligibility-evaluate";
import { browseMarketplaceSchema } from "@/features/task-marketplace/validators";
import type {
  MarketplaceAnalytics,
  MarketplacePage,
  WorkOpportunity,
} from "@/features/task-marketplace/types";
import { expireReservations } from "@/features/task-marketplace/services/reservation-engine";

const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}::${id}`, "utf8").toString("base64url");
}

function decodeCursor(
  cursor: string,
): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = raw.split("::");
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function toOpportunity(row: {
  id: string;
  publicId: string;
  createdAt: Date;
  taskTemplateVersion: number;
  templatePublicId: string;
  priority: string;
  campaign: {
    id: string;
    publicId: string;
    name: string;
    category: string;
    description: string;
    objective: string;
    rewardPerUnitMinor: number;
    currency: string;
    countryScope: unknown;
    languageScope: unknown;
    deviceScope: unknown;
  };
  taskTemplate: {
    publicId: string;
    name: string;
    estimatedDurationMin: number | null;
  };
}): WorkOpportunity {
  return {
    instancePublicId: row.publicId,
    instanceId: row.id,
    campaignPublicId: row.campaign.publicId,
    campaignId: row.campaign.id,
    title: row.campaign.name,
    category: row.campaign.category,
    description: row.campaign.description,
    objective: row.campaign.objective,
    rewardPerUnitMinor: row.campaign.rewardPerUnitMinor,
    currency: row.campaign.currency,
    priority: row.priority,
    estimatedDurationMin: row.taskTemplate.estimatedDurationMin,
    templatePublicId: row.taskTemplate.publicId,
    templateName: row.taskTemplate.name,
    templateVersion: row.taskTemplateVersion,
    countryScope: row.campaign.countryScope as string[],
    languageScope: row.campaign.languageScope as string[],
    deviceScope: row.campaign.deviceScope as string[],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function browseWorkOpportunities(params: {
  input: unknown;
}): Promise<ApiResponse<MarketplacePage>> {
  try {
    await expireReservations();
    const parsed = browseMarketplaceSchema.parse(params.input);
    const cursor = parsed.cursor ? decodeCursor(parsed.cursor) : null;

    const rows = await prisma.taskInstance.findMany({
      where: {
        status: "available",
        reserved: false,
        ...(parsed.campaignId ? { campaignId: parsed.campaignId } : {}),
        campaign: {
          status: "active",
          ...(parsed.category ? { category: parsed.category } : {}),
          ...(parsed.query
            ? {
                OR: [
                  { name: { contains: parsed.query, mode: "insensitive" } },
                  {
                    description: {
                      contains: parsed.query,
                      mode: "insensitive",
                    },
                  },
                  { category: { contains: parsed.query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                {
                  createdAt: new Date(cursor.createdAt),
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      },
      include: {
        campaign: true,
        taskTemplate: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: parsed.limit * 3,
    });

    let opportunities = rows.map(toOpportunity);

    if (parsed.sort === "oldest") {
      opportunities = [...opportunities].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      );
    } else if (parsed.sort === "reward_desc") {
      opportunities = [...opportunities].sort(
        (a, b) => b.rewardPerUnitMinor - a.rewardPerUnitMinor,
      );
    } else if (parsed.sort === "reward_asc") {
      opportunities = [...opportunities].sort(
        (a, b) => a.rewardPerUnitMinor - b.rewardPerUnitMinor,
      );
    } else if (parsed.sort === "priority") {
      opportunities = [...opportunities].sort(
        (a, b) =>
          (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0),
      );
    }

    if (parsed.country) {
      opportunities = opportunities.filter(
        (o) =>
          o.countryScope.length === 0 ||
          o.countryScope.includes(parsed.country!),
      );
    }
    if (parsed.language) {
      opportunities = opportunities.filter(
        (o) =>
          o.languageScope.length === 0 ||
          o.languageScope.includes(parsed.language!),
      );
    }

    if (parsed.excludeIneligible && parsed.worker) {
      const filtered: WorkOpportunity[] = [];
      for (const item of opportunities) {
        const full = rows.find((r) => r.id === item.instanceId);
        if (!full) continue;
        const merged = mergeEligibilityRules({
          templateConstraints: full.taskTemplate
            .constraints as TemplateConstraint[],
          campaignConstraints: full.campaign
            .audienceConstraints as TemplateConstraint[],
        });
        const evaluation = evaluateWorkerEligibility({
          constraints: merged.constraints,
          worker: parsed.worker,
          countryScope: full.campaign.countryScope as string[],
          languageScope: full.campaign.languageScope as string[],
          deviceScope: full.campaign.deviceScope as string[],
        });
        if (evaluation.eligible) filtered.push(item);
      }
      opportunities = filtered;
    }

    const pageItems = opportunities.slice(0, parsed.limit);
    const last = pageItems[pageItems.length - 1];
    const nextCursor =
      pageItems.length === parsed.limit && last
        ? encodeCursor(last.createdAt, last.instanceId)
        : null;

    const totalAvailable = await prisma.taskInstance.count({
      where: {
        status: "available",
        reserved: false,
        campaign: { status: "active" },
      },
    });

    return apiSuccess({
      items: pageItems,
      nextCursor,
      totalAvailable,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "BROWSE_FAILED",
      error instanceof Error ? error.message : "Could not browse marketplace",
    );
  }
}

export async function getMarketplaceAnalytics(): Promise<
  ApiResponse<MarketplaceAnalytics>
> {
  try {
    await expireReservations();
    const [available, reserved, claimed, reservationStats] = await Promise.all([
      prisma.taskInstance.count({
        where: { status: "available", reserved: false },
      }),
      prisma.taskInstance.count({ where: { status: "reserved" } }),
      prisma.taskInstance.count({ where: { status: "claimed" } }),
      reservationRepository.analyticsCounts(),
    ]);

    const denom = available + reserved + claimed;
    const claimRate = denom === 0 ? 0 : claimed / denom;
    const reservationTimeoutRate =
      reservationStats.total === 0
        ? 0
        : reservationStats.expired / reservationStats.total;

    return apiSuccess({
      available,
      reserved,
      claimed,
      claimRate,
      reservationTimeoutRate,
      reservationsTotal: reservationStats.total,
      reservationsExpired: reservationStats.expired,
      reservationsConverted: reservationStats.converted,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "ANALYTICS_FAILED",
      error instanceof Error ? error.message : "Could not load analytics",
    );
  }
}
