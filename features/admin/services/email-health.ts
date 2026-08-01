/**
 * Admin Email Health — Command Center signals for Resend ops.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { resendAdapterMode } from "@/lib/integrations/notifications/resend-adapter";
import { isResendConfigured } from "@/lib/integrations/notifications/resend/client";
import { getMetricsSnapshot } from "@/lib/observability/metrics";

export type EmailHealthSnapshot = {
  providerMode: "live" | "stub";
  keysConfigured: boolean;
  queueSize: number;
  sentToday: number;
  failures: number;
  retries: number;
  deadLettered: number;
  bounceRate: number | null;
  complaintRate: number | null;
  providerStatus: "ready" | "stub";
  generatedAt: string;
};

export async function getEmailHealthSnapshot(): Promise<EmailHealthSnapshot> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [
    queueSize,
    sentToday,
    failures,
    retries,
    deadLettered,
    deliveredWindow,
    bouncedWindow,
    complainedWindow,
  ] = await Promise.all([
    prisma.notificationJob.count({
      where: {
        channel: "email",
        status: { in: ["scheduled", "queued", "delivering"] },
      },
    }),
    prisma.notificationJob.count({
      where: {
        channel: "email",
        status: "delivered",
        deliveredAt: { gte: startOfDay },
      },
    }),
    prisma.notificationJob.count({
      where: {
        channel: "email",
        status: { in: ["failed", "dead_lettered"] },
      },
    }),
    prisma.notificationJob.count({
      where: {
        channel: "email",
        status: "scheduled",
        attempts: { gt: 0 },
      },
    }),
    prisma.notificationJob.count({
      where: { channel: "email", status: "dead_lettered" },
    }),
    prisma.notificationJob.count({
      where: {
        channel: "email",
        status: "delivered",
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.notificationJob.count({
      where: {
        channel: "email",
        status: "dead_lettered",
        failureDetails: { path: ["reason"], equals: "email.bounced" },
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.notificationJob.count({
      where: {
        channel: "email",
        status: "dead_lettered",
        failureDetails: { path: ["reason"], equals: "complaint" },
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const denom = deliveredWindow + bouncedWindow + complainedWindow;
  const bounceRate = denom > 0 ? bouncedWindow / denom : null;
  const complaintRate = denom > 0 ? complainedWindow / denom : null;

  void getMetricsSnapshot();

  return {
    providerMode: resendAdapterMode(),
    keysConfigured: isResendConfigured(),
    queueSize,
    sentToday,
    failures,
    retries,
    deadLettered,
    bounceRate,
    complaintRate,
    providerStatus: isResendConfigured() ? "ready" : "stub",
    generatedAt: new Date().toISOString(),
  };
}
