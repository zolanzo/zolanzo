/**
 * Analytics Event Service — append-only ledger (Prisma path).
 * Analytics never mutates domain data.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { generatePublicId } from "@/lib/public-id";
import {
  isAnalyticsEngineEnabled,
  ANALYTICS_MODEL_VERSION,
} from "@/lib/analytics/config";
import { defaultMetricValue } from "@/lib/analytics/event-catalog";
import { contributionsForEvent } from "@/lib/analytics/aggregator";
import { toMetricDate } from "@/lib/analytics/period";
import {
  recordAnalyticsEventTelemetry,
} from "@/lib/analytics/telemetry";
import type {
  AnalyticsEventRecord,
  RecordAnalyticsEventInput,
} from "@/lib/analytics/types";
import type { Prisma } from "@/lib/generated/prisma/client";

function mapRow(row: {
  id: string;
  publicId: string;
  source: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  organizationId: string | null;
  userId: string | null;
  payload: unknown;
  occurredAt: Date;
  processedAt: Date | null;
  idempotencyKey: string;
  correlationId: string | null;
  causationId: string | null;
  status: string;
  attemptCount: number;
  errorMessage: string | null;
  metricValue: number;
  modelVersion: string;
  createdAt: Date;
}): AnalyticsEventRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    source: row.source as AnalyticsEventRecord["source"],
    eventType: row.eventType as AnalyticsEventRecord["eventType"],
    entityType: row.entityType,
    entityId: row.entityId,
    organizationId: row.organizationId,
    userId: row.userId,
    payload: (row.payload as Record<string, unknown>) ?? {},
    occurredAt: row.occurredAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
    idempotencyKey: row.idempotencyKey,
    correlationId: row.correlationId,
    causationId: row.causationId,
    status: row.status as AnalyticsEventRecord["status"],
    attemptCount: row.attemptCount,
    errorMessage: row.errorMessage,
    metricValue: row.metricValue,
    modelVersion: row.modelVersion,
    createdAt: row.createdAt.toISOString(),
  };
}

async function applyMetricContributions(
  event: AnalyticsEventRecord,
): Promise<void> {
  const now = new Date();
  const contributions = contributionsForEvent(event);
  // Parallel upserts for independent metric keys — same increments as sequential.
  await Promise.all(
    contributions.map((c) =>
      prisma.analyticsDailyMetric.upsert({
        where: {
          metricDate_dimension_dimensionKey_metricKey: {
            metricDate: new Date(`${c.metricDate}T00:00:00.000Z`),
            dimension: c.dimension,
            dimensionKey: c.dimensionKey,
            metricKey: c.metricKey,
          },
        },
        create: {
          metricDate: new Date(`${c.metricDate}T00:00:00.000Z`),
          dimension: c.dimension,
          dimensionKey: c.dimensionKey,
          metricKey: c.metricKey,
          value: c.delta,
          eventCount: 1,
        },
        update: {
          value: { increment: c.delta },
          eventCount: { increment: 1 },
          updatedAt: now,
        },
      }),
    ),
  );
}

export async function recordAnalyticsEvent(
  input: RecordAnalyticsEventInput,
): Promise<AnalyticsEventRecord | null> {
  if (!isAnalyticsEngineEnabled()) return null;
  const started = Date.now();

  try {
    const existing = await prisma.analyticsEvent.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      recordAnalyticsEventTelemetry({
        success: true,
        duplicate: true,
        latencyMs: Date.now() - started,
        source: existing.source,
      });
      return mapRow(existing);
    }

    const occurredAt =
      input.occurredAt == null
        ? new Date()
        : typeof input.occurredAt === "string"
          ? new Date(input.occurredAt)
          : input.occurredAt;

    const metricValue = defaultMetricValue(
      input.eventType,
      input.payload,
      input.metricValue,
    );

    const publicId = await generatePublicId("analytics_event");
    const now = new Date();
    const row = await prisma.analyticsEvent.create({
      data: {
        publicId,
        source: input.source,
        eventType: input.eventType,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        occurredAt,
        processedAt: now,
        processorVersion: ANALYTICS_MODEL_VERSION,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId ?? null,
        causationId: input.causationId ?? null,
        status: "processed",
        attemptCount: 1,
        metricValue,
        modelVersion: ANALYTICS_MODEL_VERSION,
      },
    });

    const mapped = mapRow(row);
    await applyMetricContributions(mapped);

    recordAnalyticsEventTelemetry({
      success: true,
      latencyMs: Date.now() - started,
      source: input.source,
    });
    return mapped;
  } catch (error) {
    recordAnalyticsEventTelemetry({
      success: false,
      latencyMs: Date.now() - started,
      source: input.source,
    });
    throw error;
  }
}

export async function replayPendingAnalyticsEvents(limit = 100): Promise<{
  processed: number;
  failed: number;
}> {
  if (!isAnalyticsEngineEnabled()) return { processed: 0, failed: 0 };
  const pending = await prisma.analyticsEvent.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    orderBy: { occurredAt: "asc" },
    take: limit,
  });

  let processed = 0;
  let failed = 0;
  for (const row of pending) {
    try {
      const mapped = mapRow(row);
      await applyMetricContributions(mapped);
      await prisma.analyticsEvent.update({
        where: { id: row.id },
        data: {
          status: "processed",
          processedAt: new Date(),
          processorVersion: ANALYTICS_MODEL_VERSION,
          errorMessage: null,
        },
      });
      processed += 1;
    } catch (error) {
      failed += 1;
      const attempts = row.attemptCount + 1;
      const dead = attempts >= row.maxAttempts;
      await prisma.analyticsEvent.update({
        where: { id: row.id },
        data: {
          status: dead ? "dead_letter" : "failed",
          attemptCount: attempts,
          nextRetryAt: dead
            ? null
            : new Date(Date.now() + attempts * 60_000),
          errorMessage:
            error instanceof Error ? error.message : String(error),
        },
      });
      recordAnalyticsEventTelemetry({
        success: false,
        latencyMs: 0,
        deadLetter: dead,
        source: row.source,
      });
    }
  }
  return { processed, failed };
}

export { toMetricDate };
