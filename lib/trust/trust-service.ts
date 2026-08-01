/**
 * Server entry for trust — persistence + domain event processing (4.2B).
 */

import "server-only";

export {
  TrustProfileService,
  resolveProfile,
  resolveScore,
  resolveScoresBatch,
  recalculate,
  recordEvent,
  history,
  replayPendingEvents,
  batchRecalculate,
  nightlyReconciliation,
  type RecordTrustEventInput,
  type TrustHistoryEntry,
} from "@/lib/trust/trust-profile-service";

export { safeRecordTrustEvent } from "@/lib/trust/safe-emit";
export { bootstrapTrustProfiles } from "@/lib/trust/bootstrap";
export { loadTrustSignalSnapshot } from "@/lib/trust/profile-loader";

export {
  PassportService,
  getTrustPassport,
  getPassportBadgeMetadata,
} from "@/lib/trust/passport/passport-service";
export { buildTrustPassport } from "@/lib/trust/passport/passport-builder";

import { recordEvent } from "@/lib/trust/trust-profile-service";
import type { TrustEventType, TrustSubjectType } from "@/lib/trust/types";
import type { TrustProfile } from "@/lib/trust/types";

/** @deprecated Prefer safeRecordTrustEvent / TrustProfileService.recordEvent */
export async function processTrustDomainEvent(params: {
  userId: string;
  type: TrustEventType;
  subjectType?: TrustSubjectType;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
}): Promise<TrustProfile | null> {
  const result = await recordEvent({
    subjectType: params.subjectType ?? "worker",
    subjectId: params.userId,
    eventType: params.type,
    idempotencyKey:
      params.idempotencyKey ??
      `legacy:${params.type}:${params.userId}:${params.occurredAt ?? Date.now()}`,
    payload: params.payload,
    occurredAt: params.occurredAt,
  });
  return result.profile;
}
