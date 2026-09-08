/**
 * Maps PIN-product roles (worker / employer) onto Prisma RBAC
 * (user_roles + users.participation) without overlay profile columns.
 */

export type SignupProductRole = "worker" | "employer";

export type ProductRole =
  | "worker"
  | "employer"
  | "admin"
  | "super_admin"
  | "staff";

export type OnboardingAddress = {
  state?: string;
  city?: string;
  language?: string;
  companyName?: string | null;
  industry?: string | null;
  website?: string | null;
};

export function signupRoleToParticipation(
  role: SignupProductRole,
): "worker" | "client" {
  return role === "employer" ? "client" : "worker";
}

export function signupRoleToRoleKeys(role: SignupProductRole): string[] {
  return role === "employer" ? ["client"] : ["worker"];
}

/** JWT proxy uses product roles (worker / employer / staff / admin), not profiles.role. */
export function jwtAppMetadataRoles(role: ProductRole): string[] {
  return [role];
}

/** Swap worker/client catalog keys; keep platform roles such as admin. */
export function mergeWorkerClientRoleKeys(
  existingKeys: readonly string[],
  signupRole: SignupProductRole,
): string[] {
  const nextProduct = signupRoleToRoleKeys(signupRole);
  const preserved = existingKeys.filter(
    (key) => key !== "worker" && key !== "client",
  );
  return [...new Set([...nextProduct, ...preserved])];
}

export function productRoleFromRbac(input: {
  participation: "worker" | "client" | "both" | null;
  roleKeys: readonly string[];
}): ProductRole {
  const keys = new Set(input.roleKeys);
  if (keys.has("super_admin")) return "super_admin";
  if (keys.has("admin")) return "admin";
  if (
    keys.has("staff") ||
    keys.has("operations") ||
    keys.has("moderator")
  ) {
    return "staff";
  }
  if (
    keys.has("client") ||
    input.participation === "client" ||
    input.participation === "both"
  ) {
    if (keys.has("worker") && input.participation === "worker") {
      return "worker";
    }
    if (keys.has("client") || input.participation === "client") {
      return "employer";
    }
  }
  if (keys.has("worker") || input.participation === "worker") {
    return "worker";
  }
  return "worker";
}

export function isOnboardingComplete(input: {
  countryCode: string | null;
  addressJson: unknown;
}): boolean {
  if (!input.countryCode?.trim()) return false;
  const address = parseOnboardingAddress(input.addressJson);
  return Boolean(address?.city?.trim());
}

export function parseOnboardingAddress(
  value: unknown,
): OnboardingAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    state: typeof record.state === "string" ? record.state : undefined,
    city: typeof record.city === "string" ? record.city : undefined,
    language: typeof record.language === "string" ? record.language : undefined,
    companyName:
      typeof record.companyName === "string" ? record.companyName : null,
    industry: typeof record.industry === "string" ? record.industry : null,
    website: typeof record.website === "string" ? record.website : null,
  };
}

export function buildOnboardingAddressJson(input: {
  state?: string;
  city?: string;
  language?: string;
  companyName?: string | null;
  industry?: string | null;
  website?: string | null;
}): OnboardingAddress {
  return {
    state: input.state?.trim() || "",
    city: input.city?.trim() || "",
    language: input.language?.trim() || "English",
    companyName: input.companyName?.trim() || null,
    industry: input.industry?.trim() || null,
    website: input.website?.trim() || null,
  };
}

export function signupRoleFromProductRole(
  role: ProductRole,
): SignupProductRole {
  return role === "employer" ? "employer" : "worker";
}
