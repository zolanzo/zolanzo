/**
 * Identity platform conceptual models (design only — not Prisma).
 * Implementation comes after this architecture is approved.
 */

import type {
  OrganizationId,
  UserId,
  WorkspaceId,
  TeamId,
  MembershipId,
  SessionId,
  DeviceId,
  WalletId,
  ApiKeyId,
  AccountType,
  ParticipationMode,
} from "@/types/domain";
import type { OrgRole } from "@/constants/org-roles";
import type { ClientEntityKind } from "@/constants/client-kinds";
import type { TrustBadge, VerificationLevel } from "@/constants/trust";
import type { AuthMethodId } from "@/constants/auth-methods";

// ── User & profiles ──────────────────────────────────────────

export type UserAccountModel = {
  id: UserId;
  accountType: AccountType;
  email: string | null;
  emailVerifiedAt: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
  participation: ParticipationMode | null;
  locale: string;
  timezone: string;
  createdAt: string;
  suspendedAt: string | null;
};

export type PublicProfileModel = {
  userId: UserId;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  countryCode: string | null;
  badges: TrustBadge[];
};

export type PrivateProfileModel = {
  userId: UserId;
  legalName: string | null;
  dateOfBirth: string | null;
  address: Record<string, string> | null;
  marketingOptIn: boolean;
};

export type UserReputationModel = {
  userId: UserId;
  trustScore: number; // 0–100
  workerReputation: number | null;
  clientReputation: number | null;
  completedAssignments: number;
  approvalRate: number | null;
  disputeRate: number | null;
};

export type SkillProfileModel = {
  userId: UserId;
  skills: string[];
  languages: Array<{ code: string; proficiency: string }>;
  countries: string[];
  certifications: string[];
  portfolioUrls: string[];
  workHistorySummary: string | null;
};

// ── Worker profile ───────────────────────────────────────────

export type WorkerProfileModel = {
  userId: UserId;
  skills: string[];
  availability: "full_time" | "part_time" | "flexible" | "unavailable";
  hourlyPreferenceMinor: number | null;
  currency: string | null;
  languages: string[];
  devicesOwned: string[];
  operatingSystems: string[];
  internetSpeedMbps: number | null;
  countryCode: string | null;
  state: string | null;
  city: string | null;
  education: string | null;
  experienceYears: number | null;
  aiSkills: string[];
  testingSkills: string[];
  verificationLevel: VerificationLevel;
};

// ── Client profile (replaces Advertiser) ─────────────────────

export type ClientProfileModel = {
  userId: UserId | null;
  organizationId: OrganizationId | null;
  entityKind: ClientEntityKind;
  displayName: string;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  verificationLevel: VerificationLevel;
  verifiedEmployer: boolean;
};

// ── Developer profile ────────────────────────────────────────

export type DeveloperProfileModel = {
  userId: UserId;
  organizationId: OrganizationId | null;
  apiKeyIds: ApiKeyId[];
  oauthAppIds: string[];
  webhookEndpointIds: string[];
  rateLimitTier: string[];
};

// ── Organization / tenancy ───────────────────────────────────

export type OrganizationModel = {
  id: OrganizationId;
  name: string;
  slug: string;
  ownerUserId: UserId;
  billingEmail: string;
  sharedWalletId: WalletId;
  plan: string;
  whiteLabelEnabled: boolean;
  createdAt: string;
};

export type WorkspaceModel = {
  id: WorkspaceId;
  organizationId: OrganizationId;
  name: string;
  slug: string;
  /** Future: isolate campaigns/budgets within an org */
  status: "active" | "archived";
};

export type OrganizationMembershipModel = {
  id: MembershipId;
  organizationId: OrganizationId;
  userId: UserId;
  role: OrgRole;
  status: "invited" | "active" | "suspended" | "removed";
  invitedBy: UserId | null;
  acceptedAt: string | null;
};

export type TeamModel = {
  id: TeamId;
  organizationId: OrganizationId;
  workspaceId: WorkspaceId | null;
  name: string;
};

export type OrganizationAuditLogModel = {
  id: string;
  organizationId: OrganizationId;
  actorUserId: UserId | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

// ── Auth / security ──────────────────────────────────────────

export type AuthIdentityModel = {
  id: string;
  userId: UserId;
  method: AuthMethodId;
  providerSubject: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type SessionModel = {
  id: SessionId;
  userId: UserId;
  deviceId: DeviceId | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  ipHash: string | null;
  userAgent: string | null;
  geoCountry: string | null;
};

export type TrustedDeviceModel = {
  id: DeviceId;
  userId: UserId;
  label: string;
  trustedAt: string;
  lastSeenAt: string;
  riskScore: number;
};

export type MfaMethodModel = {
  id: string;
  userId: UserId;
  kind: "totp" | "sms" | "recovery_codes" | "passkey";
  enabled: boolean;
  createdAt: string;
};

export type LoginHistoryModel = {
  id: string;
  userId: UserId;
  sessionId: SessionId | null;
  success: boolean;
  method: AuthMethodId;
  ipHash: string | null;
  geoCountry: string | null;
  riskScore: number;
  createdAt: string;
};

export type RiskSignalModel = {
  id: string;
  userId: UserId | null;
  organizationId: OrganizationId | null;
  signal: string;
  scoreDelta: number;
  source: string;
  createdAt: string;
};
