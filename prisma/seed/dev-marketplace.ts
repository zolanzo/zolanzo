import { createClient } from "@supabase/supabase-js";
import type { Prisma } from "../../lib/generated/prisma/client";
import type {
  GenerationPolicyKind,
  GenerationStrategyKind,
  PrismaClient,
  ScheduleMode,
} from "../../lib/generated/prisma/client";
import {
  seedAllocateClientPublicId,
  seedAllocateOrganizationPublicId,
  seedAllocateWorkerPublicId,
  seedGeneratePublicId,
} from "./allocate-public-id";
import {
  personalOrganizationName,
  personalOrganizationSlug,
} from "../../lib/auth/identity-helpers";
import { buildOnboardingAddressJson } from "../../lib/auth/product-identity";
import { createCampaignSchema } from "../../features/campaigns/validators";
import { calculateCampaignBudget } from "../../features/campaigns/services/budget-engine";
import {
  DEV_CAMPAIGN_SLUG,
  DEV_HIRER_ORG_NAME,
  DEV_HIRER_ORG_SLUG,
  DEV_MARKETPLACE_FIXTURE_PIN,
  DEV_MARKETPLACE_USERS,
  DEV_TEMPLATE_KEY,
} from "./dev-marketplace-constants";

function authPasswordFromPin(pin: string): string {
  return `${pin}_ZOLANZO_SECURE_KEY`;
}

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) {
    throw new Error(
      "Abort seed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findAuthUserByEmail(email: string) {
  const admin = adminClient();
  const normalized = email.toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw new Error(`Auth listUsers failed: ${error.message}`);
    }
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 50) return null;
  }
}

async function ensureAuthUser(params: {
  email: string;
  displayName: string;
  jwtRoles: readonly string[];
}): Promise<string> {
  const admin = adminClient();
  const password = authPasswordFromPin(DEV_MARKETPLACE_FIXTURE_PIN);
  const existing = await findAuthUserByEmail(params.email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: params.displayName },
      app_metadata: {
        ...((existing.app_metadata as Record<string, unknown> | undefined) ??
          {}),
        roles: [...params.jwtRoles],
        fixture: "zolanzo-dev-marketplace",
      },
    });
    if (error) {
      throw new Error(`Auth update failed for ${params.email}: ${error.message}`);
    }
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: params.displayName },
    app_metadata: {
      roles: [...params.jwtRoles],
      fixture: "zolanzo-dev-marketplace",
    },
  });
  if (error || !data.user) {
    throw new Error(
      `Auth create failed for ${params.email}: ${error?.message ?? "unknown"}`,
    );
  }
  return data.user.id;
}

async function ensureRoles(
  prisma: PrismaClient,
  userId: string,
  roleKeys: readonly string[],
): Promise<void> {
  const roles = await prisma.role.findMany({
    where: { key: { in: [...roleKeys] } },
  });
  if (roles.length !== roleKeys.length) {
    const found = new Set(roles.map((role) => role.key));
    const missing = roleKeys.filter((key) => !found.has(key));
    throw new Error(`Missing platform roles: ${missing.join(", ")}`);
  }
  const keepIds = roles.map((role) => role.id);
  await prisma.userRole.deleteMany({
    where: { userId, roleId: { notIn: keepIds } },
  });
  for (const role of roles) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
  }
}

async function ensurePersonalOrg(
  prisma: PrismaClient,
  userId: string,
  email: string,
  displayName: string,
): Promise<string> {
  const slug = personalOrganizationSlug(userId);
  let org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        publicId: await seedAllocateOrganizationPublicId(prisma),
        name: personalOrganizationName(displayName),
        slug,
        kind: "personal",
        ownerUserId: userId,
        billingEmail: email,
        members: {
          create: {
            userId,
            orgRole: "owner",
            status: "active",
            joinedAt: new Date(),
          },
        },
      },
    });
  } else {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: org.id, userId },
      },
    });
    if (!membership) {
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          orgRole: "owner",
          status: "active",
          joinedAt: new Date(),
        },
      });
    }
  }
  return org.id;
}

async function ensureFixtureUser(
  prisma: PrismaClient,
  spec: (typeof DEV_MARKETPLACE_USERS)[keyof typeof DEV_MARKETPLACE_USERS],
): Promise<{ userId: string; personalOrgId: string }> {
  const authSubject = await ensureAuthUser({
    email: spec.email,
    displayName: spec.displayName,
    jwtRoles: spec.jwtRoles,
  });

  let user = await prisma.user.findFirst({
    where: { OR: [{ authSubject }, { email: spec.email }] },
    include: { profile: true },
  });

  if (!user) {
    const [workerPublicId, clientPublicId] = await Promise.all([
      seedAllocateWorkerPublicId(prisma),
      seedAllocateClientPublicId(prisma),
    ]);
    user = await prisma.user.create({
      data: {
        id: authSubject,
        authSubject,
        email: spec.email,
        emailVerifiedAt: new Date(),
        accountType: "individual",
        participation: spec.participation,
        timezone: "Africa/Lagos",
        status: "active",
        profile: {
          create: {
            id: authSubject,
            displayName: spec.displayName,
            handle: spec.handle,
            workerPublicId,
            clientPublicId,
            countryCode: "NG",
            addressJson: buildOnboardingAddressJson({
              state: "Lagos",
              city: "Lagos",
              language: "English",
              companyName:
                spec.email === DEV_MARKETPLACE_USERS.hirer.email
                  ? DEV_HIRER_ORG_NAME
                  : null,
            }) as unknown as Prisma.InputJsonValue,
          },
        },
      },
      include: { profile: true },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        authSubject,
        email: spec.email,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        participation: spec.participation,
        status: "active",
      },
    });
    if (user.profile) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          displayName: spec.displayName,
          countryCode: "NG",
          addressJson: buildOnboardingAddressJson({
            state: "Lagos",
            city: "Lagos",
            language: "English",
            companyName:
              spec.email === DEV_MARKETPLACE_USERS.hirer.email
                ? DEV_HIRER_ORG_NAME
                : null,
          }) as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  await ensureRoles(prisma, user.id, spec.roleKeys);
  const personalOrgId = await ensurePersonalOrg(
    prisma,
    user.id,
    spec.email,
    spec.displayName,
  );

  if (!user.activeOrganizationId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeOrganizationId: personalOrgId },
    });
  }

  return { userId: user.id, personalOrgId };
}

async function ensureHirerBusinessOrg(
  prisma: PrismaClient,
  hirerUserId: string,
  hirerEmail: string,
): Promise<string> {
  let org = await prisma.organization.findUnique({
    where: { slug: DEV_HIRER_ORG_SLUG },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        publicId: await seedAllocateOrganizationPublicId(prisma),
        name: DEV_HIRER_ORG_NAME,
        slug: DEV_HIRER_ORG_SLUG,
        kind: "business",
        ownerUserId: hirerUserId,
        billingEmail: hirerEmail,
        members: {
          create: {
            userId: hirerUserId,
            orgRole: "owner",
            status: "active",
            joinedAt: new Date(),
          },
        },
      },
    });
  } else {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: hirerUserId,
        },
      },
    });
    if (!membership) {
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: hirerUserId,
          orgRole: "owner",
          status: "active",
          joinedAt: new Date(),
        },
      });
    }
  }

  await prisma.user.update({
    where: { id: hirerUserId },
    data: { activeOrganizationId: org.id },
  });
  return org.id;
}

async function ensureDraftCampaign(
  prisma: PrismaClient,
  params: { organizationId: string; clientUserId: string },
): Promise<void> {
  const existing = await prisma.campaign.findUnique({
    where: {
      organizationId_slug: {
        organizationId: params.organizationId,
        slug: DEV_CAMPAIGN_SLUG,
      },
    },
  });
  if (existing) {
    const metadata = {
      ...(((existing.metadata as Record<string, unknown> | null) ?? {})),
      seeded: true,
      fixture: "zolanzo-dev-marketplace",
      developmentOnly: true,
      reviewPolicyKey: "always_human",
      settlementPolicyKey: "immediate",
    };
    await prisma.campaign.update({
      where: { id: existing.id },
      data: {
        metadata,
        languageScope: [],
        countryScope: [],
        deviceScope: [],
      },
    });
    process.stdout.write(
      `Fixture campaign already exists (${existing.status}); leaving inventory in place.\n`,
    );
    return;
  }

  const template = await prisma.taskTemplate.findFirst({
    where: { templateKey: DEV_TEMPLATE_KEY, status: "published" },
    orderBy: { version: "desc" },
  });
  if (!template) {
    throw new Error(
      `Published template ${DEV_TEMPLATE_KEY} is missing. Seed templates first.`,
    );
  }

  const parsed = createCampaignSchema.parse({
    organizationId: params.organizationId,
    clientUserId: params.clientUserId,
    taskTemplateId: template.id,
    name: "DEV Fixture Website Signup",
    slug: DEV_CAMPAIGN_SLUG,
    description:
      "Development-only campaign for exercising marketplace claim, evidence, and review. Not production work.",
    objective: "Provide two test work units for the development marketplace workflow.",
    visibility: "platform",
    priority: "normal",
    category: "growth",
    tags: ["dev-fixture", "do-not-use-in-production"],
    brief: {
      businessObjective: "Exercise the real hirer → staff → earner → review path.",
      successMetrics: ["Two claimable units after staff approval"],
      workerInstructions:
        "Open the test signup URL, create a throwaway account, and paste confirmation text as proof.",
      qualityExpectations: "Proof must mention the confirmation screen or email.",
      acceptableExamples: ["Screenshot description of the confirmation page"],
      unacceptableExamples: ["Empty proof or unrelated text"],
      reviewerGuidance: "Approve only if the worker included a confirmation note.",
    },
    generationStrategy: "pre_generated",
    generationPolicy: "fixed_quantity",
    generationPolicyConfig: { policy: "fixed_quantity", quantity: 2 },
    targetQuantity: 2,
    budgetKind: "quantity_times_reward",
    currency: "NGN",
    rewardPerUnitMinor: 80000,
    countryScope: [],
    languageScope: [],
    deviceScope: [],
    audienceConstraints: [],
    claimPolicies: [
      { kind: "first_come_first_served" },
      { kind: "max_concurrent_assignments", max: 2 },
    ],
    reservationTimeoutSeconds: 120,
    scheduleMode: "immediate",
    timezone: "Africa/Lagos",
    metadata: {
      seeded: true,
      fixture: "zolanzo-dev-marketplace",
      developmentOnly: true,
      reviewPolicyKey: "always_human",
      settlementPolicyKey: "immediate",
    },
  });

  const budget = calculateCampaignBudget({
    kind: parsed.budgetKind,
    currency: parsed.currency,
    fixedBudgetMinor: parsed.budgetMinor,
    targetQuantity: parsed.targetQuantity,
    rewardPerUnitMinor: parsed.rewardPerUnitMinor,
  });

  await prisma.campaign.create({
    data: {
      publicId: await seedGeneratePublicId("campaign", prisma),
      organizationId: parsed.organizationId,
      clientUserId: parsed.clientUserId,
      taskTemplateId: parsed.taskTemplateId,
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      objective: parsed.objective,
      status: "draft",
      visibility: parsed.visibility,
      priority: parsed.priority,
      category: parsed.category,
      tags: parsed.tags as Prisma.InputJsonValue,
      brief: parsed.brief as Prisma.InputJsonValue,
      generationStrategy: parsed.generationStrategy as GenerationStrategyKind,
      generationConfig: (parsed.generationConfig ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      generationPolicy: parsed.generationPolicy as GenerationPolicyKind,
      generationPolicyConfig: (parsed.generationPolicyConfig ??
        undefined) as Prisma.InputJsonValue | undefined,
      targetQuantity: parsed.targetQuantity,
      budgetKind: parsed.budgetKind,
      currency: parsed.currency,
      budgetMinor: budget.budgetMinor,
      rewardPerUnitMinor: parsed.rewardPerUnitMinor,
      countryScope: parsed.countryScope as Prisma.InputJsonValue,
      languageScope: parsed.languageScope as Prisma.InputJsonValue,
      deviceScope: parsed.deviceScope as Prisma.InputJsonValue,
      audienceConstraints: parsed.audienceConstraints as Prisma.InputJsonValue,
      claimPolicies: parsed.claimPolicies as Prisma.InputJsonValue,
      reservationTimeoutSeconds: parsed.reservationTimeoutSeconds,
      scheduleMode: parsed.scheduleMode as ScheduleMode,
      timezone: parsed.timezone,
      createdByUserId: parsed.clientUserId,
      updatedByUserId: parsed.clientUserId,
      metadata: parsed.metadata as Prisma.InputJsonValue,
    },
  });
}

export async function seedDevMarketplace(prisma: PrismaClient): Promise<void> {
  const admin = await ensureFixtureUser(prisma, DEV_MARKETPLACE_USERS.admin);
  const staff = await ensureFixtureUser(prisma, DEV_MARKETPLACE_USERS.staff);
  const worker = await ensureFixtureUser(prisma, DEV_MARKETPLACE_USERS.worker);
  const worker2 = await ensureFixtureUser(prisma, DEV_MARKETPLACE_USERS.worker2);
  const hirer = await ensureFixtureUser(prisma, DEV_MARKETPLACE_USERS.hirer);
  const orgId = await ensureHirerBusinessOrg(
    prisma,
    hirer.userId,
    DEV_MARKETPLACE_USERS.hirer.email,
  );
  await ensureDraftCampaign(prisma, {
    organizationId: orgId,
    clientUserId: hirer.userId,
  });

  process.stdout.write(
    [
      "Development marketplace fixtures ready:",
      `  admin   ${DEV_MARKETPLACE_USERS.admin.email} (${admin.userId}) jwt=${DEV_MARKETPLACE_USERS.admin.jwtRoles.join(",")}`,
      `  staff   ${DEV_MARKETPLACE_USERS.staff.email} (${staff.userId}) jwt=${DEV_MARKETPLACE_USERS.staff.jwtRoles.join(",")}`,
      `  worker  ${DEV_MARKETPLACE_USERS.worker.email} (${worker.userId})`,
      `  worker2 ${DEV_MARKETPLACE_USERS.worker2.email} (${worker2.userId})`,
      `  hirer   ${DEV_MARKETPLACE_USERS.hirer.email} (${hirer.userId}) jwt=${DEV_MARKETPLACE_USERS.hirer.jwtRoles.join(",")}`,
      `  org     ${DEV_HIRER_ORG_SLUG}`,
      `  campaign ${DEV_CAMPAIGN_SLUG} (draft until hirer submits / staff approves)`,
      "  wallets not pre-created; provisioned by settlement/wallet services",
      `  PIN     development fixture PIN is ${DEV_MARKETPLACE_FIXTURE_PIN}`,
      "",
    ].join("\n"),
  );
}
