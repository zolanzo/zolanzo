import type { Prisma } from "../../lib/generated/prisma/client";
import type {
  GenerationPolicyKind,
  GenerationStrategyKind,
  PrismaClient,
  TaskInstancePriority,
  TaskInstanceStatus,
} from "../../lib/generated/prisma/client";
import { generatePublicId } from "../../lib/public-id/generator";

/** Seed inventory sizes — keep small for local/dev. */
const SEED_LIMITS: Record<string, number> = {
  "lagos-fintech-app-qa": 10,
  "retail-shelf-labeling": 5,
  "abuja-property-spot-checks": 0,
  "ng-consumer-pulse": 0,
  "partner-portal-signup": 8,
};

export async function seedTaskInstances(prisma: PrismaClient): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ["active", "scheduled"] },
      metadata: { path: ["seeded"], equals: true },
    },
    include: { taskTemplate: true },
  });

  for (const campaign of campaigns) {
    const limit = SEED_LIMITS[campaign.slug] ?? 0;
    if (limit <= 0) continue;

    const existing = await prisma.taskInstance.count({
      where: { campaignId: campaign.id },
    });
    if (existing > 0) continue;

    const quantity = Math.min(limit, campaign.targetQuantity);
    const rows: Prisma.TaskInstanceCreateManyInput[] = [];

    for (let i = 0; i < quantity; i += 1) {
      const publicId = await generatePublicId("task", { db: prisma });
      rows.push({
        publicId,
        campaignId: campaign.id,
        taskTemplateId: campaign.taskTemplateId,
        taskTemplateVersion: campaign.taskTemplate.version,
        sequenceNumber: i + 1,
        generationStrategy:
          campaign.generationStrategy as GenerationStrategyKind,
        generationPolicy: campaign.generationPolicy as GenerationPolicyKind,
        generationPolicyConfig: (campaign.generationPolicyConfig ??
          undefined) as Prisma.InputJsonValue | undefined,
        status: "available" as TaskInstanceStatus,
        priority: campaign.priority as TaskInstancePriority,
        reserved: false,
        campaignPublicId: campaign.publicId,
        templatePublicId: campaign.taskTemplate.publicId,
        metadata: { seeded: true } as Prisma.InputJsonValue,
      });
    }

    if (rows.length > 0) {
      await prisma.taskInstance.createMany({ data: rows });
    }
  }
}
