/**
 * Persistent TrustProfileService — single source of reputation truth.
 * Owns calculation, persistence, trends, explanations.
 * Never mutates wallets / reviews / assignments.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { generatePublicId } from "@/lib/public-id";
import { buildTrustProfileFromSnapshot } from "@/lib/trust/trust-engine";
import {
  defaultWeightForTrustEvent,
  applyEventToSignalCounters,
} from "@/lib/trust/event-processor";
import { applyDecayToWeight } from "@/lib/trust/time-decay";
import { loadTrustSignalSnapshot } from "@/lib/trust/profile-loader";
import { emptyTrustSignalSnapshot } from "@/lib/trust/signal-snapshot";
import {
  mapTrustProfileRow,
  profileToPersistData,
} from "@/lib/trust/mappers";
import {
  isTrustEngineEnabled,
  TRUST_ENGINE_MODEL_VERSION,
} from "@/lib/trust/config";
import {
  recordTrustEventDeadLetter,
  recordTrustEventFailed,
  recordTrustEventProcessed,
} from "@/lib/trust/telemetry";
import type {
  TrustEventType,
  TrustProfile,
  TrustSubjectType,
  TrustWeightedEvent,
} from "@/lib/trust/types";
import type { Prisma } from "@/lib/generated/prisma/client";

export type RecordTrustEventInput = {
  subjectType: TrustSubjectType;
  subjectId: string;
  eventType: TrustEventType;
  payload?: Record<string, unknown>;
  occurredAt?: Date | string;
  idempotencyKey: string;
  correlationId?: string;
  causationId?: string;
  rawWeight?: number;
  /** Skip recalculation (store event only) */
  deferRecalc?: boolean;
};

export type TrustHistoryEntry = {
  id: string;
  overallScore: number;
  dimensions: TrustProfile["dimensions"];
  trend: string;
  reasons: string[];
  calculatedAt: string;
  triggerEventId: string | null;
};

function userIdForSubject(
  subjectType: TrustSubjectType,
  subjectId: string,
): string | null {
  return subjectType === "organization" ? null : subjectId;
}

async function ensureProfileShell(params: {
  subjectType: TrustSubjectType;
  subjectId: string;
}): Promise<{ id: string; publicId: string; version: number }> {
  const existing = await prisma.trustProfile.findUnique({
    where: {
      subjectType_subjectId: {
        subjectType: params.subjectType,
        subjectId: params.subjectId,
      },
    },
    select: { id: true, publicId: true, version: true },
  });
  if (existing) return existing;

  const publicId = await generatePublicId("trust_profile");
  const userId = userIdForSubject(params.subjectType, params.subjectId);
  const created = await prisma.trustProfile.create({
    data: {
      publicId,
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      userId,
      overallScore: 50,
      identityScore: 0,
      reliabilityScore: 50,
      qualityScore: 50,
      behaviorScore: 100,
      experienceScore: 0,
      reputationScore: 45,
      trend: "unknown",
      reasons: [],
      warnings: [],
      lastCalculatedAt: new Date(),
      modelVersion: TRUST_ENGINE_MODEL_VERSION,
      version: 1,
    },
    select: { id: true, publicId: true, version: true },
  });
  return created;
}

async function loadWeightedEvents(
  subjectType: TrustSubjectType,
  subjectId: string,
): Promise<TrustWeightedEvent[]> {
  const rows = await prisma.trustEvent.findMany({
    where: {
      subjectType,
      subjectId,
      status: { in: ["processed", "pending"] },
    },
    orderBy: { occurredAt: "desc" },
    take: 200,
  });
  const now = new Date();
  return rows.map((row) => {
    const { decayedWeight, decayFactor } = applyDecayToWeight({
      rawWeight: row.rawWeight,
      occurredAt: row.occurredAt.toISOString(),
      now,
    });
    return {
      id: row.id,
      userId: row.userId ?? subjectId,
      type: row.eventType as TrustEventType,
      occurredAt: row.occurredAt.toISOString(),
      rawWeight: row.rawWeight,
      decayedWeight,
      decayFactor,
      payload: (row.payload as Record<string, unknown>) ?? undefined,
    };
  });
}

function mergeEventCounters(
  base: Awaited<ReturnType<typeof loadTrustSignalSnapshot>>,
  events: TrustWeightedEvent[],
) {
  const counters = {
    fraudConfirmedCount: base.fraudConfirmedCount,
    policyViolationCount: base.policyViolationCount,
    appealUpheldCount: base.appealUpheldCount,
    appealDeniedCount: base.appealDeniedCount,
    warningCount: base.warningCount,
    suspensionCount: base.suspensionCount,
    organizationEndorsements: base.organizationEndorsements,
    verifiedRecommendations: base.verifiedRecommendations,
    assignmentsCompleted: base.assignmentsCompleted,
    assignmentsTotal: base.assignmentsTotal,
    reviewsApproved: base.reviewsApproved,
    reviewsDecided: base.reviewsDecided,
    revisionRequestCount: base.revisionRequestCount,
    emailVerified: base.emailVerified,
    phoneVerified: base.phoneVerified,
    governmentIdVerified: base.governmentIdVerified,
  };

  for (const e of events) {
    if (
      e.type === "fraud_confirmed" ||
      e.type === "fraud_cleared" ||
      e.type === "policy_violation" ||
      e.type === "warning_issued" ||
      e.type === "suspension" ||
      e.type === "reinstatement" ||
      e.type === "organization_endorsement" ||
      e.type === "appeal_upheld" ||
      e.type === "appeal_denied" ||
      e.type === "email_verified" ||
      e.type === "phone_verified" ||
      e.type === "identity_verified"
    ) {
      applyEventToSignalCounters(counters, e.type);
    }
  }
  return counters;
}

async function persistProfile(
  profile: TrustProfile,
  shell: { id: string; version: number },
  triggerEventId?: string | null,
): Promise<TrustProfile> {
  const data = profileToPersistData(profile);
  const updated = await prisma.trustProfile.update({
    where: { id: shell.id },
    data: {
      ...data,
      version: shell.version + 1,
      reasons: data.reasons as Prisma.InputJsonValue,
      warnings: data.warnings as Prisma.InputJsonValue,
      dimensionDetails: data.dimensionDetails as Prisma.InputJsonValue,
      lastInfluencingEvents:
        data.lastInfluencingEvents as Prisma.InputJsonValue,
    },
  });

  await prisma.trustScoreHistory.create({
    data: {
      profileId: shell.id,
      overallScore: profile.overallScore,
      identityScore: profile.dimensions.identity,
      reliabilityScore: profile.dimensions.reliability,
      qualityScore: profile.dimensions.quality,
      behaviorScore: profile.dimensions.behavior,
      experienceScore: profile.dimensions.experience,
      reputationScore: profile.dimensions.reputation,
      trend: profile.trend,
      reasons: profile.reasons as Prisma.InputJsonValue,
      triggerEventId: triggerEventId ?? null,
      calculatedAt: new Date(profile.calculatedAt),
      modelVersion: profile.modelVersion,
    },
  });

  return mapTrustProfileRow(updated);
}

/**
 * Full recalculation from domain signals + persisted events.
 */
export async function recalculate(params: {
  subjectType: TrustSubjectType;
  subjectId: string;
  triggerEventId?: string | null;
}): Promise<TrustProfile> {
  if (!isTrustEngineEnabled()) {
    return buildTrustProfileFromSnapshot(
      emptyTrustSignalSnapshot({ userId: params.subjectId }),
      { forceDisabled: true },
    );
  }

  const shell = await ensureProfileShell(params);
  const existing = await prisma.trustProfile.findUniqueOrThrow({
    where: { id: shell.id },
  });

  let base =
    params.subjectType === "organization"
      ? emptyTrustSignalSnapshot({
          userId: params.subjectId,
          subjectKind: "organization",
        })
      : await loadTrustSignalSnapshot(params.subjectId);

  const events = await loadWeightedEvents(
    params.subjectType,
    params.subjectId,
  );
  const counters = mergeEventCounters(base, events);
  base = {
    ...base,
    ...counters,
    weightedEvents: events,
    previousOverallScore: existing.overallScore,
    previousCalculatedAt: existing.lastCalculatedAt.toISOString(),
    subjectKind:
      params.subjectType === "organization"
        ? "organization"
        : params.subjectType === "reviewer"
          ? "reviewer"
          : "worker",
  };

  const computed = buildTrustProfileFromSnapshot(base, {
    publicId: shell.publicId,
    version: shell.version,
  });
  computed.subjectType = params.subjectType;
  computed.subjectId = params.subjectId;

  return persistProfile(computed, shell, params.triggerEventId);
}

export async function resolveProfile(params: {
  subjectType: TrustSubjectType;
  subjectId: string;
  /** Recalculate if missing */
  ensure?: boolean;
}): Promise<TrustProfile | null> {
  const row = await prisma.trustProfile.findUnique({
    where: {
      subjectType_subjectId: {
        subjectType: params.subjectType,
        subjectId: params.subjectId,
      },
    },
  });
  if (row) return mapTrustProfileRow(row);
  if (params.ensure !== false) {
    return recalculate(params);
  }
  return null;
}

export async function resolveScore(params: {
  subjectType: TrustSubjectType;
  subjectId: string;
}): Promise<number> {
  const profile = await resolveProfile({ ...params, ensure: true });
  return profile?.overallScore ?? 50;
}

/** Batch resolve — missing profiles fall back to ensure=false (caller may bootstrap). */
export async function resolveScoresBatch(params: {
  subjectType: TrustSubjectType;
  subjectIds: string[];
}): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (params.subjectIds.length === 0) return out;
  const rows = await prisma.trustProfile.findMany({
    where: {
      subjectType: params.subjectType,
      subjectId: { in: params.subjectIds },
    },
    select: { subjectId: true, overallScore: true },
  });
  for (const row of rows) {
    out.set(row.subjectId, row.overallScore);
  }
  return out;
}

/**
 * Record append-only event with idempotency; process + recalculate.
 */
export async function recordEvent(
  input: RecordTrustEventInput,
): Promise<{ eventId: string; profile: TrustProfile | null; duplicate: boolean }> {
  if (!isTrustEngineEnabled()) {
    return { eventId: "", profile: null, duplicate: false };
  }

  const existing = await prisma.trustEvent.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    const profile = await resolveProfile({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      ensure: false,
    });
    return {
      eventId: existing.id,
      profile,
      duplicate: true,
    };
  }

  const shell = await ensureProfileShell({
    subjectType: input.subjectType,
    subjectId: input.subjectId,
  });
  const occurredAt = input.occurredAt
    ? new Date(input.occurredAt)
    : new Date();
  const rawWeight =
    input.rawWeight ?? defaultWeightForTrustEvent(input.eventType);
  const { decayedWeight } = applyDecayToWeight({
    rawWeight,
    occurredAt: occurredAt.toISOString(),
  });

  const publicId = await generatePublicId("trust_event");
  const maxSeq = await prisma.trustEvent.aggregate({
    where: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
    },
    _max: { sequence: true },
  });
  const sequence = BigInt(Number(maxSeq._max.sequence ?? 0) + 1);

  let eventRow;
  try {
    eventRow = await prisma.trustEvent.create({
      data: {
        publicId,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        userId: userIdForSubject(input.subjectType, input.subjectId),
        profileId: shell.id,
        eventType: input.eventType,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        occurredAt,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId ?? null,
        causationId: input.causationId ?? null,
        sequence,
        status: "pending",
        attemptCount: 1,
        rawWeight,
        decayedWeight,
        processorVersion: TRUST_ENGINE_MODEL_VERSION,
      },
    });
  } catch (error) {
    // Unique race on idempotency
    const again = await prisma.trustEvent.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (again) {
      return {
        eventId: again.id,
        profile: await resolveProfile({
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          ensure: false,
        }),
        duplicate: true,
      };
    }
    throw error;
  }

  if (input.deferRecalc) {
    return { eventId: eventRow.id, profile: null, duplicate: false };
  }

  try {
    const profile = await recalculate({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      triggerEventId: eventRow.id,
    });
    await prisma.trustEvent.update({
      where: { id: eventRow.id },
      data: {
        status: "processed",
        processedAt: new Date(),
        processorVersion: TRUST_ENGINE_MODEL_VERSION,
      },
    });
    recordTrustEventProcessed(1);
    return { eventId: eventRow.id, profile, duplicate: false };
  } catch (error) {
    const attemptCount = eventRow.attemptCount + 1;
    const dead = attemptCount >= eventRow.maxAttempts;
    await prisma.trustEvent.update({
      where: { id: eventRow.id },
      data: {
        status: dead ? "dead_letter" : "failed",
        attemptCount,
        nextRetryAt: dead
          ? null
          : new Date(Date.now() + attemptCount * 60_000),
        errorMessage:
          error instanceof Error ? error.message : String(error),
      },
    });
    if (dead) recordTrustEventDeadLetter(1);
    else recordTrustEventFailed(1);
    throw error;
  }
}

export async function history(params: {
  subjectType: TrustSubjectType;
  subjectId: string;
  limit?: number;
}): Promise<TrustHistoryEntry[]> {
  const profile = await prisma.trustProfile.findUnique({
    where: {
      subjectType_subjectId: {
        subjectType: params.subjectType,
        subjectId: params.subjectId,
      },
    },
    select: { id: true },
  });
  if (!profile) return [];

  const rows = await prisma.trustScoreHistory.findMany({
    where: { profileId: profile.id },
    orderBy: { calculatedAt: "desc" },
    take: params.limit ?? 50,
  });

  return rows.map((r) => ({
    id: r.id,
    overallScore: r.overallScore,
    dimensions: {
      identity: r.identityScore,
      reliability: r.reliabilityScore,
      quality: r.qualityScore,
      behavior: r.behaviorScore,
      experience: r.experienceScore,
      reputation: r.reputationScore,
    },
    trend: r.trend,
    reasons: Array.isArray(r.reasons)
      ? (r.reasons as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    calculatedAt: r.calculatedAt.toISOString(),
    triggerEventId: r.triggerEventId,
  }));
}

/** Replay failed / pending events in occurredAt order. */
export async function replayPendingEvents(params?: {
  limit?: number;
  includeDeadLetter?: boolean;
}): Promise<{ processed: number; failed: number }> {
  const statuses = params?.includeDeadLetter
    ? ["pending", "failed", "dead_letter"]
    : ["pending", "failed"];
  const rows = await prisma.trustEvent.findMany({
    where: {
      status: { in: statuses },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } },
      ],
    },
    orderBy: [{ occurredAt: "asc" }, { sequence: "asc" }],
    take: params?.limit ?? 100,
  });

  let processed = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await recalculate({
        subjectType: row.subjectType as TrustSubjectType,
        subjectId: row.subjectId,
        triggerEventId: row.id,
      });
      await prisma.trustEvent.update({
        where: { id: row.id },
        data: {
          status: "processed",
          processedAt: new Date(),
          errorMessage: null,
          nextRetryAt: null,
          processorVersion: TRUST_ENGINE_MODEL_VERSION,
        },
      });
      recordTrustEventProcessed(1);
      processed += 1;
    } catch (error) {
      const attemptCount = row.attemptCount + 1;
      const dead = attemptCount >= row.maxAttempts;
      await prisma.trustEvent.update({
        where: { id: row.id },
        data: {
          status: dead ? "dead_letter" : "failed",
          attemptCount,
          nextRetryAt: dead
            ? null
            : new Date(Date.now() + attemptCount * 60_000),
          errorMessage:
            error instanceof Error ? error.message : String(error),
        },
      });
      if (dead) recordTrustEventDeadLetter(1);
      else recordTrustEventFailed(1);
      failed += 1;
    }
  }
  return { processed, failed };
}

export async function batchRecalculate(params: {
  subjectType?: TrustSubjectType;
  subjectIds?: string[];
  limit?: number;
}): Promise<{ recalculated: number }> {
  const where: Prisma.TrustProfileWhereInput = {};
  if (params.subjectType) where.subjectType = params.subjectType;
  if (params.subjectIds?.length) where.subjectId = { in: params.subjectIds };

  const rows = await prisma.trustProfile.findMany({
    where,
    take: params.limit ?? 200,
    select: { subjectType: true, subjectId: true },
  });

  let recalculated = 0;
  for (const row of rows) {
    await recalculate({
      subjectType: row.subjectType as TrustSubjectType,
      subjectId: row.subjectId,
    });
    recalculated += 1;
  }
  return { recalculated };
}

export async function nightlyReconciliation(params?: {
  limit?: number;
}): Promise<{ recalculated: number; replayed: number }> {
  const replay = await replayPendingEvents({
    limit: params?.limit ?? 200,
  });
  const batch = await batchRecalculate({ limit: params?.limit ?? 200 });
  return {
    recalculated: batch.recalculated,
    replayed: replay.processed,
  };
}

export const TrustProfileService = {
  resolveProfile,
  resolveScore,
  resolveScoresBatch,
  recalculate,
  recordEvent,
  history,
  replayPendingEvents,
  batchRecalculate,
  nightlyReconciliation,
};
