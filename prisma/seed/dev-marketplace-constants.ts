/**
 * Deterministic development marketplace fixture identifiers.
 * Emails are local-only and must never be production accounts.
 */

export const DEV_MARKETPLACE_FIXTURE_PIN = "246810";

export type DevMarketplaceUserSpec = {
  email: string;
  displayName: string;
  handle: string;
  /** Prisma `user_roles` keys (must exist in constants/roles). */
  roleKeys: readonly string[];
  /** JWT `app_metadata.roles` for proxy homes (product roles). */
  jwtRoles: readonly string[];
  participation: "worker" | "client";
};

export const DEV_MARKETPLACE_USERS = {
  admin: {
    email: "admin-dev@zolanzo.local",
    displayName: "DEV Platform Admin",
    handle: "dev-platform-admin",
    roleKeys: ["admin"] as const,
    jwtRoles: ["admin"] as const,
    participation: "worker" as const,
  },
  staff: {
    email: "staff-reviewer-dev@zolanzo.local",
    displayName: "DEV Staff Reviewer",
    handle: "dev-staff-reviewer",
    roleKeys: ["operations", "moderator"] as const,
    jwtRoles: ["staff"] as const,
    participation: "worker" as const,
  },
  worker: {
    email: "worker-dev@zolanzo.local",
    displayName: "DEV Earner Worker",
    handle: "dev-earner-worker",
    roleKeys: ["worker"] as const,
    jwtRoles: ["worker"] as const,
    participation: "worker" as const,
  },
  worker2: {
    email: "worker2-dev@zolanzo.local",
    displayName: "DEV Earner Worker Two",
    handle: "dev-earner-worker-2",
    roleKeys: ["worker"] as const,
    jwtRoles: ["worker"] as const,
    participation: "worker" as const,
  },
  hirer: {
    email: "hirer-dev@zolanzo.local",
    displayName: "DEV Hirer Client",
    handle: "dev-hirer-client",
    roleKeys: ["client"] as const,
    jwtRoles: ["employer"] as const,
    participation: "client" as const,
  },
} as const satisfies Record<string, DevMarketplaceUserSpec>;

export const DEV_HIRER_ORG_SLUG = "dev-fixture-hirer-workspace";
export const DEV_HIRER_ORG_NAME = "ZOLANZO DEV Fixture Hirer Org";
export const DEV_CAMPAIGN_SLUG = "dev-fixture-website-signup";
export const DEV_TEMPLATE_KEY = "website_signup";
