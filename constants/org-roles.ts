/**
 * Organization-scoped roles (first-class tenancy).
 * Distinct from platform roles in constants/roles.ts.
 */

export const ORG_ROLES = [
  "owner",
  "admin",
  "finance",
  "campaign_manager",
  "reviewer",
  "team_member",
  "read_only",
  /** Reserved — custom role definitions stored per org */
  "custom",
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  finance: "Finance",
  campaign_manager: "Campaign Manager",
  reviewer: "Reviewer",
  team_member: "Team Member",
  read_only: "Read-only",
  custom: "Custom",
};

export const ORG_ROLE_RANK: Record<OrgRole, number> = {
  read_only: 10,
  team_member: 20,
  reviewer: 30,
  campaign_manager: 40,
  finance: 50,
  admin: 80,
  owner: 100,
  custom: 0,
};

/**
 * Capabilities within an organization (checked with org membership).
 */
export const ORG_PERMISSIONS = [
  "org.members.invite",
  "org.members.manage",
  "org.roles.assign",
  "org.settings.write",
  "org.billing.manage",
  "org.wallet.read",
  "org.wallet.spend",
  "org.campaigns.read",
  "org.campaigns.write",
  "org.campaigns.publish",
  "org.submissions.review",
  "org.reports.read",
  "org.analytics.read",
  "org.api_keys.manage",
  "org.audit.read",
  "org.workspaces.manage",
] as const;

export type OrgPermission = (typeof ORG_PERMISSIONS)[number];

export const ORG_ROLE_PERMISSIONS: Record<
  Exclude<OrgRole, "custom">,
  readonly OrgPermission[] | "*"
> = {
  owner: "*",
  admin: [
    "org.members.invite",
    "org.members.manage",
    "org.roles.assign",
    "org.settings.write",
    "org.wallet.read",
    "org.campaigns.read",
    "org.campaigns.write",
    "org.campaigns.publish",
    "org.submissions.review",
    "org.reports.read",
    "org.analytics.read",
    "org.api_keys.manage",
    "org.audit.read",
    "org.workspaces.manage",
  ],
  finance: [
    "org.billing.manage",
    "org.wallet.read",
    "org.wallet.spend",
    "org.reports.read",
    "org.analytics.read",
    "org.audit.read",
    "org.campaigns.read",
  ],
  campaign_manager: [
    "org.campaigns.read",
    "org.campaigns.write",
    "org.campaigns.publish",
    "org.submissions.review",
    "org.reports.read",
    "org.analytics.read",
    "org.wallet.read",
  ],
  reviewer: [
    "org.campaigns.read",
    "org.submissions.review",
    "org.reports.read",
  ],
  team_member: [
    "org.campaigns.read",
    "org.campaigns.write",
    "org.reports.read",
  ],
  read_only: ["org.campaigns.read", "org.reports.read", "org.analytics.read"],
};

export function orgRoleHasPermission(
  role: OrgRole,
  permission: OrgPermission,
): boolean {
  if (role === "custom") return false; // resolved via org-specific grants later
  const grants = ORG_ROLE_PERMISSIONS[role];
  if (grants === "*") return true;
  return grants.includes(permission);
}
