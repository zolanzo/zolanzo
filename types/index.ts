/**
 * Shared application types for the ZOLANZO foundation.
 * Feature-specific types live under features/<name>/types.
 */

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type SortDirection = "asc" | "desc";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

export type {
  ActorContext,
  AccountType,
  AssignmentId,
  CampaignId,
  OrganizationId,
  ParticipationMode,
  SubmissionId,
  TaskId,
  TeamId,
  TenantScope,
  UserId,
  UserType,
  WalletId,
  PaymentId,
  DisputeId,
  WorkspaceId,
  MembershipId,
  SessionId,
  DeviceId,
  ApiKeyId,
} from "@/types/domain";

export {
  USER_TYPES,
  ACCOUNT_TYPES,
  normalizeParticipation,
  normalizeUserType,
} from "@/types/domain";
