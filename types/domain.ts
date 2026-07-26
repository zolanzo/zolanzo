/**
 * Core identity & actor types for the ZOLANZO workforce marketplace.
 * Feature modules import these — do not redefine.
 *
 * Demand-side language: **Client** (posts work).
 * "advertiser" remains a deprecated alias for compatibility only.
 */

/** Stable branded IDs (opaque strings until Prisma models land) */
export type UserId = string & { readonly __brand: "UserId" };
export type OrganizationId = string & { readonly __brand: "OrganizationId" };
export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type TeamId = string & { readonly __brand: "TeamId" };
export type MembershipId = string & { readonly __brand: "MembershipId" };
export type SessionId = string & { readonly __brand: "SessionId" };
export type DeviceId = string & { readonly __brand: "DeviceId" };
export type CampaignId = string & { readonly __brand: "CampaignId" };
export type TaskId = string & { readonly __brand: "TaskId" };
export type AssignmentId = string & { readonly __brand: "AssignmentId" };
export type SubmissionId = string & { readonly __brand: "SubmissionId" };
export type WalletId = string & { readonly __brand: "WalletId" };
export type PaymentId = string & { readonly __brand: "PaymentId" };
export type DisputeId = string & { readonly __brand: "DisputeId" };
export type ApiKeyId = string & { readonly __brand: "ApiKeyId" };

/**
 * Top-level account kinds (how the person/entity shows up on the platform).
 * Participation (worker/client) is orthogonal and can stack.
 */
export const ACCOUNT_TYPES = [
  "guest",
  "individual",
  "organization",
  "developer",
  "moderator",
  "support",
  "admin",
  "super_admin",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * @deprecated Prefer ACCOUNT_TYPES + participation modes.
 * Kept for Step 3 compatibility during migration to Client language.
 */
export const USER_TYPES = [
  "guest",
  "worker",
  "client",
  /** @deprecated Use `client` */
  "advertiser",
  "organization",
  "moderator",
  "support",
  "admin",
  "super_admin",
  "developer",
  "api_client",
] as const;

export type UserType = (typeof USER_TYPES)[number];

/** How a user participates in the work marketplace */
export type ParticipationMode = "worker" | "client" | "both";

/**
 * @deprecated Use ParticipationMode with `client`
 */
export type LegacyParticipationMode = "worker" | "advertiser" | "both";

export type TenantScope = {
  organizationId: OrganizationId | null;
  workspaceId: WorkspaceId | null;
  teamIds: TeamId[];
};

export type ActorContext = {
  userId: UserId | null;
  accountType: AccountType | null;
  /** @deprecated Prefer accountType + participation */
  userTypes: UserType[];
  participation: ParticipationMode | null;
  tenant: TenantScope;
  orgRoles: string[];
  isAuthenticated: boolean;
};

/** Normalize legacy advertiser → client */
export function normalizeParticipation(
  mode: ParticipationMode | LegacyParticipationMode | null,
): ParticipationMode | null {
  if (!mode) return null;
  if (mode === "advertiser") return "client";
  if (mode === "both") return "both";
  return mode;
}

export function normalizeUserType(type: UserType): UserType {
  return type === "advertiser" ? "client" : type;
}
