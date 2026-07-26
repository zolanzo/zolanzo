import type { Prisma } from "../../lib/generated/prisma/client";
import type { PrismaClient } from "../../lib/generated/prisma/client";
import { generatePublicId } from "../../lib/public-id/generator";
import { SEED_TASK_TEMPLATES } from "../../features/task-templates/seed/definitions";
import { createTaskTemplateSchema } from "../../features/task-templates/validators";

export async function seedTaskTemplates(prisma: PrismaClient): Promise<void> {
  for (const raw of SEED_TASK_TEMPLATES) {
    const payload = createTaskTemplateSchema.parse(raw);
    const existing = await prisma.taskTemplate.findFirst({
      where: { templateKey: payload.templateKey, version: 1 },
    });
    if (existing) continue;

    const publicId = await generatePublicId("task_template", { db: prisma });
    await prisma.taskTemplate.create({
      data: {
        publicId,
        templateKey: payload.templateKey,
        version: 1,
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        category: payload.category,
        subcategory: payload.subcategory ?? null,
        difficulty: payload.difficulty,
        estimatedDurationMin: payload.estimatedDurationMin ?? null,
        capabilitySet: payload.capabilitySet as Prisma.InputJsonValue,
        requiredEvidence: payload.requiredEvidence as Prisma.InputJsonValue,
        submissionSchema: payload.submissionSchema as Prisma.InputJsonValue,
        validationRules: payload.validationRules as Prisma.InputJsonValue,
        reviewRules: payload.reviewRules as Prisma.InputJsonValue,
        rewardStrategy: payload.rewardStrategy as Prisma.InputJsonValue,
        constraints: payload.constraints as Prisma.InputJsonValue,
        supportedPlatforms: payload.supportedPlatforms as Prisma.InputJsonValue,
        supportedDevices: payload.supportedDevices as Prisma.InputJsonValue,
        supportedCountries: payload.supportedCountries as Prisma.InputJsonValue,
        supportedLanguages: payload.supportedLanguages as Prisma.InputJsonValue,
        requiredSkills: payload.requiredSkills as Prisma.InputJsonValue,
        visibility: payload.visibility,
        status: "published",
        publishedAt: new Date(),
        metadata: (payload.metadata ?? {
          seeded: true,
        }) as Prisma.InputJsonValue,
      },
    });
  }
}
