import type { Prisma } from "../../lib/generated/prisma/client";
import type {
  GenerationPolicyKind,
  GenerationStrategyKind,
  PrismaClient,
  ScheduleMode,
} from "../../lib/generated/prisma/client";
import {
  allocateClientPublicId,
  allocateOrganizationPublicId,
  generatePublicId,
} from "../../lib/public-id/generator";
import { SEED_CAMPAIGNS } from "../../features/campaigns/seed/definitions";
import { createCampaignSchema } from "../../features/campaigns/validators";
import { calculateCampaignBudget } from "../../features/campaigns/services/budget-engine";

const SEED_USER_EMAIL = "seed-campaigns@zolanzo.local";
const SEED_ORG_SLUG = "zolanzo-seed-workspace";

async function ensureSeedClientOrg(prisma: PrismaClient): Promise<{
  userId: string;
  organizationId: string;
}> {
  let user = await prisma.user.findUnique({
    where: { email: SEED_USER_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: SEED_USER_EMAIL,
        emailVerifiedAt: new Date(),
        accountType: "individual",
        status: "active",
        timezone: "Africa/Lagos",
        profile: {
          create: {
            displayName: "Seed Campaign Client",
            handle: "seed-campaign-client",
            clientPublicId: await allocateClientPublicId(prisma),
          },
        },
      },
    });
  }

  let org = await prisma.organization.findUnique({
    where: { slug: SEED_ORG_SLUG },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        publicId: await allocateOrganizationPublicId(prisma),
        name: "ZOLANZO Seed Workspace",
        slug: SEED_ORG_SLUG,
        kind: "business",
        ownerUserId: user.id,
        billingEmail: SEED_USER_EMAIL,
        members: {
          create: {
            userId: user.id,
            orgRole: "owner",
            status: "active",
            joinedAt: new Date(),
          },
        },
      },
    });
  }

  return { userId: user.id, organizationId: org.id };
}

export async function seedCampaigns(prisma: PrismaClient): Promise<void> {
  const { userId, organizationId } = await ensureSeedClientOrg(prisma);

  for (const def of SEED_CAMPAIGNS) {
    const existing = await prisma.campaign.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug: def.slug,
        },
      },
    });
    if (existing) continue;

    const template = await prisma.taskTemplate.findFirst({
      where: { templateKey: def.templateKey, status: "published" },
      orderBy: { version: "desc" },
    });
    if (!template) {
      process.stderr.write(
        `Skip campaign seed ${def.slug}: template ${def.templateKey} missing\n`,
      );
      continue;
    }

    const { templateKey: _tk, seedStatus, ...rest } = def;
    void _tk;
    const parsed = createCampaignSchema.parse({
      ...rest,
      organizationId,
      clientUserId: userId,
      taskTemplateId: template.id,
    });

    const budget = calculateCampaignBudget({
      kind: parsed.budgetKind,
      currency: parsed.currency,
      fixedBudgetMinor: parsed.budgetMinor,
      targetQuantity: parsed.targetQuantity,
      rewardPerUnitMinor: parsed.rewardPerUnitMinor,
    });

    const publicId = await generatePublicId("campaign", { db: prisma });
    const status = seedStatus ?? "draft";

    await prisma.campaign.create({
      data: {
        publicId,
        organizationId,
        clientUserId: userId,
        taskTemplateId: template.id,
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        objective: parsed.objective,
        status,
        visibility: parsed.visibility,
        priority: parsed.priority,
        category: parsed.category,
        tags: parsed.tags as Prisma.InputJsonValue,
        brief: parsed.brief as Prisma.InputJsonValue,
        generationStrategy:
          parsed.generationStrategy as GenerationStrategyKind,
        generationConfig: (parsed.generationConfig ??
          undefined) as Prisma.InputJsonValue | undefined,
        generationPolicy: parsed.generationPolicy as GenerationPolicyKind,
        generationPolicyConfig: (parsed.generationPolicyConfig ??
          undefined) as Prisma.InputJsonValue | undefined,
        targetQuantity: parsed.targetQuantity,
        budgetKind: parsed.budgetKind,
        currency: parsed.currency,
        budgetMinor: budget.budgetMinor,
        rewardPerUnitMinor: parsed.rewardPerUnitMinor,
        rewardStrategyOverride: (parsed.rewardStrategyOverride ??
          undefined) as Prisma.InputJsonValue | undefined,
        countryScope: parsed.countryScope as Prisma.InputJsonValue,
        languageScope: parsed.languageScope as Prisma.InputJsonValue,
        deviceScope: parsed.deviceScope as Prisma.InputJsonValue,
        audienceConstraints:
          parsed.audienceConstraints as Prisma.InputJsonValue,
        claimPolicies: parsed.claimPolicies as Prisma.InputJsonValue,
        reservationTimeoutSeconds: parsed.reservationTimeoutSeconds,
        scheduleMode: parsed.scheduleMode as ScheduleMode,
        timezone: parsed.timezone,
        startAt: parsed.startAt ? new Date(parsed.startAt) : null,
        endAt: parsed.endAt ? new Date(parsed.endAt) : null,
        recurrenceRule: parsed.recurrenceRule ?? null,
        createdByUserId: userId,
        updatedByUserId: userId,
        publishedAt:
          status === "active" || status === "scheduled" ? new Date() : null,
        metadata: (parsed.metadata ?? {
          seeded: true,
        }) as Prisma.InputJsonValue,
      },
    });
  }
}
