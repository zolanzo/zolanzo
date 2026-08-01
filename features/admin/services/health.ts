/**
 * Platform health dashboard — local signals + in-process metrics.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { listNotificationAdapters } from "@/lib/integrations/notifications";
import { listPaymentAdapters } from "@/lib/integrations/payments";
import { listMonitoringAdapters } from "@/lib/integrations/monitoring";
import { getMetricsSnapshot } from "@/lib/observability/metrics";
import { evaluateAlerts, type FiredAlert } from "@/lib/observability/alerts";
import { getReadinessHealth } from "@/lib/observability/probes";
import { APP_CONFIG } from "@/config/app";
import packageJson from "@/package.json";

/** Latest applied migration name known to this release (Phase 3A.3 RLS). */
export const EXPECTED_MIGRATION_VERSION =
  "20260726070000_rls_policies" as const;

export type AdapterStatus = {
  kind: "payment" | "notification" | "monitoring";
  providerKey: string;
  status: "ready" | "stub";
};

export type HealthDashboard = {
  buildVersion: string;
  migrationVersion: string;
  queueSizes: {
    review: number;
    settlement: number;
    withdrawal: number;
    notification: number;
    payment: number;
  };
  /** p95 processing latency from in-process metrics */
  processingLatencyMs: number | null;
  /** HTTP 5xx rate from in-process metrics */
  errorRate: number | null;
  /** Live/ready aggregate */
  platformStatus: "ok" | "degraded" | "down";
  databaseStatus: string;
  storageStatus: string;
  schedulerStatus: string;
  queueStatus: string;
  webhookStatus: {
    received: number;
    verified: number;
    rejected: number;
    replayBlocked: number;
  };
  providerHealth: AdapterStatus[];
  runningJobs: number;
  failedJobs: number;
  alerts: FiredAlert[];
  adapters: AdapterStatus[];
  generatedAt: string;
};

export async function getHealthDashboard(): Promise<HealthDashboard> {
  const [review, settlement, withdrawal, notification, payment, failedWithdrawals] =
    await Promise.all([
      prisma.reviewQueueItem.count({
        where: {
          status: { in: ["pending", "assigned", "in_review", "escalated"] },
        },
      }),
      prisma.settlement.count({
        where: {
          status: { in: ["pending", "scheduled", "processing", "failed"] },
        },
      }),
      prisma.withdrawalRequest.count({
        where: {
          status: {
            in: [
              "pending",
              "pending_approval",
              "approved",
              "scheduled",
              "processing",
              "failed",
            ],
          },
        },
      }),
      prisma.notificationJob.count({
        where: { status: { in: ["scheduled", "queued", "failed"] } },
      }),
      prisma.paymentIntent.count({
        where: {
          status: { in: ["awaiting_payment", "pending_provider", "failed"] },
        },
      }),
      prisma.withdrawalRequest.count({
        where: { status: "failed" },
      }),
    ]);

  const readiness = await getReadinessHealth({
    name: APP_CONFIG.name,
    version: packageJson.version,
  });

  const snap = getMetricsSnapshot();
  const databaseStatus =
    readiness.checks.find((c) => c.id === "database")?.status ?? "unknown";
  const storageStatus =
    readiness.checks.find((c) => c.id === "storage")?.status ?? "unknown";

  const adapters: AdapterStatus[] = [
    ...listPaymentAdapters().map((a) => {
      const ready =
        a.providerKey === "memory" ||
        (a.providerKey === "paystack" &&
          Boolean(process.env.PAYSTACK_SECRET_KEY?.trim()));
      return {
        kind: "payment" as const,
        providerKey: a.providerKey,
        status: (ready ? "ready" : "stub") as "ready" | "stub",
      };
    }),
    ...listNotificationAdapters().map((a) => {
      const ready =
        a.providerKey === "memory" ||
        (a.providerKey === "resend" &&
          Boolean(process.env.RESEND_API_KEY?.trim())) ||
        (a.providerKey === "sendchamp" &&
          Boolean(process.env.SENDCHAMP_API_KEY?.trim()));
      return {
        kind: "notification" as const,
        providerKey: a.providerKey,
        status: (ready ? "ready" : "stub") as "ready" | "stub",
      };
    }),
    ...listMonitoringAdapters().map((a) => ({
      kind: "monitoring" as const,
      providerKey: a.providerKey,
      status: (
        a.providerKey === "memory" || Boolean(process.env.SENTRY_DSN?.trim())
          ? "ready"
          : "stub"
      ) as "ready" | "stub",
    })),
  ];

  const alerts = evaluateAlerts({
    metrics: snap,
    probes: {
      databaseDown: databaseStatus === "down",
      storageDown: storageStatus === "down",
    },
    domain: { failedWithdrawals },
  });

  return {
    buildVersion: packageJson.version,
    migrationVersion: EXPECTED_MIGRATION_VERSION,
    queueSizes: { review, settlement, withdrawal, notification, payment },
    processingLatencyMs: snap.derived.processingLatencyMs,
    errorRate: snap.derived.httpErrorRate,
    platformStatus: readiness.status,
    databaseStatus,
    storageStatus,
    schedulerStatus: readiness.scheduler?.status ?? "unknown",
    queueStatus: readiness.queue?.status ?? "unknown",
    webhookStatus: {
      received: snap.derived.webhookReceived,
      verified: snap.derived.webhookVerified,
      rejected: snap.derived.webhookRejected,
      replayBlocked: snap.derived.webhookReplayBlocked,
    },
    providerHealth: adapters,
    runningJobs: readiness.scheduler?.inFlight ?? 0,
    failedJobs: snap.derived.jobFailures,
    alerts,
    adapters,
    generatedAt: new Date().toISOString(),
  };
}
