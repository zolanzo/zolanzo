/**
 * Organization domain constants — multi-tenancy architecture.
 */

export const ORGANIZATION_STATUSES = [
  "pending",
  "active",
  "suspended",
  "closed",
] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const MEMBERSHIP_STATUSES = [
  "invited",
  "active",
  "suspended",
  "removed",
] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/** Planned relational entities (design — not Prisma yet) */
export const ORGANIZATION_ENTITIES = [
  "Organization",
  "OrganizationMembership",
  "Team",
  "TeamMembership",
  "Workspace",
  "OrganizationWallet",
  "OrganizationBillingAccount",
  "OrganizationApiKey",
  "OrganizationAuditLog",
  "OrganizationInvite",
] as const;
