/**
 * Admin Trust Health — Trust & Reputation Engine observability (4.2B).
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import {
  isTrustEngineEnabled,
  isTrustExplainabilityEnabled,
  isTrustTrendsEnabled,
  getTrustDecayHalfLifeDays,
  TRUST_ENGINE_MODEL_VERSION,
} from "@/lib/trust/config";
import { getTrustTelemetrySnapshot } from "@/lib/trust/telemetry";

export type TrustHealthSnapshot = {
  trustEngineEnabled: boolean;
  explainabilityEnabled: boolean;
  trendsEnabled: boolean;
  modelVersion: string;
  decayHalfLifeDays: number;
  profiles: number;
  averageScore: number;
  distribution: Record<string, number>;
  risingTrust: number;
  fallingTrust: number;
  newlyVerifiedIdentities: number;
  recalculations: number;
  eventsProcessed: number;
  eventsFailed: number;
  eventsDeadLetter: number;
  eventsPerHour: number;
  averageLatencyMs: number;
  lastLatencyMs: number | null;
  failures: number;
  errorRate: number;
  generatedAt: string;
};

export async function getTrustHealthSnapshot(): Promise<TrustHealthSnapshot> {
  const telemetry = getTrustTelemetrySnapshot();
  const hourAgo = new Date(Date.now() - 3_600_000);

  const [
    profileCount,
    avgAgg,
    risingDb,
    fallingDb,
    eventsHour,
    dlqCount,
    failedCount,
    buckets,
  ] = await Promise.all([
    prisma.trustProfile.count().catch(() => 0),
    prisma.trustProfile
      .aggregate({ _avg: { overallScore: true } })
      .catch(() => ({ _avg: { overallScore: null } })),
    prisma.trustProfile
      .count({ where: { trend: "improving" } })
      .catch(() => 0),
    prisma.trustProfile
      .count({ where: { trend: "declining" } })
      .catch(() => 0),
    prisma.trustEvent
      .count({
        where: { createdAt: { gte: hourAgo }, status: "processed" },
      })
      .catch(() => 0),
    prisma.trustEvent
      .count({ where: { status: "dead_letter" } })
      .catch(() => 0),
    prisma.trustEvent
      .count({ where: { status: "failed" } })
      .catch(() => 0),
    prisma.trustProfile
      .findMany({
        select: { overallScore: true },
        take: 5000,
      })
      .catch(() => [] as Array<{ overallScore: number }>),
  ]);

  const distribution: Record<string, number> = {
    "0-19": 0,
    "20-49": 0,
    "50-74": 0,
    "75-89": 0,
    "90-100": 0,
  };
  for (const row of buckets) {
    const s = row.overallScore;
    const key =
      s <= 19
        ? "0-19"
        : s <= 49
          ? "20-49"
          : s <= 74
            ? "50-74"
            : s <= 89
              ? "75-89"
              : "90-100";
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  const dbAvg = avgAgg._avg.overallScore;
  return {
    trustEngineEnabled: isTrustEngineEnabled(),
    explainabilityEnabled: isTrustExplainabilityEnabled(),
    trendsEnabled: isTrustTrendsEnabled(),
    modelVersion: TRUST_ENGINE_MODEL_VERSION,
    decayHalfLifeDays: getTrustDecayHalfLifeDays(),
    profiles: profileCount,
    averageScore:
      dbAvg != null
        ? Math.round(dbAvg * 10) / 10
        : telemetry.averageScore,
    distribution:
      profileCount > 0 ? distribution : telemetry.distribution,
    risingTrust: risingDb || telemetry.risingCount,
    fallingTrust: fallingDb || telemetry.fallingCount,
    newlyVerifiedIdentities: telemetry.newlyVerifiedIdentities,
    recalculations: telemetry.recalculations,
    eventsProcessed: telemetry.eventsProcessed,
    eventsFailed: failedCount || telemetry.eventsFailed,
    eventsDeadLetter: dlqCount || telemetry.eventsDeadLetter,
    eventsPerHour: eventsHour || telemetry.eventsPerHourEstimate,
    averageLatencyMs: telemetry.averageLatencyMs,
    lastLatencyMs: telemetry.lastLatencyMs,
    failures: telemetry.failures,
    errorRate: telemetry.errorRate,
    generatedAt: new Date().toISOString(),
  };
}
