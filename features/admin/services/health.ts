/**
 * Platform health dashboard — local signals only (no live infra vendors).
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { listNotificationAdapters } from "@/lib/integrations/notifications";
import { listPaymentAdapters } from "@/lib/integrations/payments";
import packageJson from "@/package.json";

/** Latest applied migration name known to this release (Sprint 14). */
export const EXPECTED_MIGRATION_VERSION =
  "20260726060000_ai_plugin_platform" as const;

export type AdapterStatus = {
  kind: "payment" | "notification";
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
  /** Placeholder latency — no live APM in Sprint 14 */
  processingLatencyMs: null;
  /** Placeholder error rate */
  errorRate: null;
  adapters: AdapterStatus[];
  generatedAt: string;
};

export async function getHealthDashboard(): Promise<HealthDashboard> {
  const [review, settlement, withdrawal, notification, payment] =
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
    ]);

  const adapters: AdapterStatus[] = [
    ...listPaymentAdapters().map((a) => ({
      kind: "payment" as const,
      providerKey: a.providerKey,
      status: (a.providerKey === "memory" ? "ready" : "stub") as
        | "ready"
        | "stub",
    })),
    ...listNotificationAdapters().map((a) => ({
      kind: "notification" as const,
      providerKey: a.providerKey,
      status: (a.providerKey === "memory" ? "ready" : "stub") as
        | "ready"
        | "stub",
    })),
  ];

  return {
    buildVersion: packageJson.version,
    migrationVersion: EXPECTED_MIGRATION_VERSION,
    queueSizes: { review, settlement, withdrawal, notification, payment },
    processingLatencyMs: null,
    errorRate: null,
    adapters,
    generatedAt: new Date().toISOString(),
  };
}
