import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/lib/audit/write";
import type { Prisma } from "@/lib/generated/prisma/client";
import { applySignupProductRole } from "@/lib/auth/apply-product-role";
import {
  buildOnboardingAddressJson,
  isOnboardingComplete,
  productRoleFromRbac,
  signupRoleFromProductRole,
  type SignupProductRole,
} from "@/lib/auth/product-identity";

export interface OnboardingProfileData {
  role?: SignupProductRole;
  country?: string;
  state?: string;
  city?: string;
  language?: string;
  companyName?: string;
  industry?: string;
  website?: string;
}

export function calculateProfileCompletion(
  data: Partial<OnboardingProfileData>,
): number {
  let score = 40;

  if (data.role) score += 20;
  if (data.country && data.city) score += 20;

  if (data.role === "worker") {
    if (data.language) score += 20;
  } else if (data.role === "employer") {
    if (data.companyName || data.industry) score += 20;
  }

  return Math.min(score, 100);
}

function calculateOnboardingRoleFromUser(user: {
  participation: "worker" | "client" | "both" | null;
  roles: { role: { key: string } }[];
}): SignupProductRole {
  const productRole = productRoleFromRbac({
    participation: user.participation,
    roleKeys: user.roles.map((row) => row.role.key),
  });
  return signupRoleFromProductRole(productRole);
}

export class OnboardingService {
  static async getSessionRole(authSubject: string): Promise<SignupProductRole> {
    const user = await prisma.user.findFirst({
      where: { OR: [{ authSubject }, { id: authSubject }] },
      select: {
        participation: true,
        roles: { include: { role: { select: { key: true } } } },
      },
    });
    if (!user) {
      throw new Error("Profile could not be loaded.");
    }
    return calculateOnboardingRoleFromUser(user);
  }

  static async completeOnboarding(
    authSubject: string,
    data: OnboardingProfileData,
  ) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ authSubject }, { id: authSubject }] },
      include: {
        profile: true,
        roles: { include: { role: { select: { key: true } } } },
      },
    });
    if (!user?.profile) {
      throw new Error("Onboarding submission failed.");
    }

    const role = calculateOnboardingRoleFromUser(user);
    const countryCode = (data.country || "Nigeria").trim();
    const addressJson = buildOnboardingAddressJson({
      state: data.state,
      city: data.city,
      language: data.language,
      companyName: data.companyName,
      industry: data.industry,
      website: data.website,
    });

    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        countryCode,
        addressJson: addressJson as Prisma.InputJsonValue,
      },
    });

    const completion = calculateProfileCompletion({ ...data, role });
    if (
      !isOnboardingComplete({
        countryCode,
        addressJson,
      })
    ) {
      throw new Error("Onboarding submission failed.");
    }

    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.onboarding_completed",
      resourceType: "profile",
      resourceId: user.profile.id,
      organizationId: user.activeOrganizationId,
    });

    return { success: true, profileCompletion: completion, role };
  }

  static async updateRole(authSubject: string, role: SignupProductRole) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ authSubject }, { id: authSubject }] },
      select: { id: true, authSubject: true },
    });
    if (!user) {
      throw new Error("Profile could not be loaded.");
    }
    const synced = await applySignupProductRole({
      userId: user.id,
      authSubject: user.authSubject ?? authSubject,
      role,
    });
    return { success: true, role, ...synced };
  }
}
