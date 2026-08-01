/**
 * Admin Communication Health — SMS + WhatsApp (Sendchamp) ops signals.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import {
  getSendchampCircuitHealth,
  sendchampAdapterMode,
} from "@/lib/integrations/notifications/sendchamp-adapter";
import { isSendchampConfigured } from "@/lib/integrations/notifications/sendchamp/client";
import { getMetricsSnapshot } from "@/lib/observability/metrics";

export type CommunicationHealthSnapshot = {
  providerMode: "live" | "stub";
  keysConfigured: boolean;
  smsSent: number;
  whatsappSent: number;
  failures: number;
  retries: number;
  deadLettered: number;
  deliveryRate: number | null;
  latencyMs: number | null;
  circuit: {
    state: string;
    failures: number;
  };
  providerStatus: "ready" | "stub" | "circuit_open";
  generatedAt: string;
};

export async function getCommunicationHealthSnapshot(): Promise<CommunicationHealthSnapshot> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [smsSent, whatsappSent, failures, retries, deadLettered, delivered, attempted] =
    await Promise.all([
      prisma.notificationJob.count({
        where: {
          channel: "sms",
          status: "delivered",
          deliveredAt: { gte: startOfDay },
        },
      }),
      prisma.notificationJob.count({
        where: {
          channel: "whatsapp",
          status: "delivered",
          deliveredAt: { gte: startOfDay },
        },
      }),
      prisma.notificationJob.count({
        where: {
          channel: { in: ["sms", "whatsapp"] },
          status: { in: ["failed", "dead_lettered"] },
        },
      }),
      prisma.notificationJob.count({
        where: {
          channel: { in: ["sms", "whatsapp"] },
          status: "scheduled",
          attempts: { gt: 0 },
        },
      }),
      prisma.notificationJob.count({
        where: {
          channel: { in: ["sms", "whatsapp"] },
          status: "dead_lettered",
        },
      }),
      prisma.notificationJob.count({
        where: {
          channel: { in: ["sms", "whatsapp"] },
          status: "delivered",
          updatedAt: { gte: weekAgo },
        },
      }),
      prisma.notificationJob.count({
        where: {
          channel: { in: ["sms", "whatsapp"] },
          updatedAt: { gte: weekAgo },
          attempts: { gt: 0 },
        },
      }),
    ]);

  const circuit = getSendchampCircuitHealth();
  const snap = getMetricsSnapshot();
  const deliveryRate = attempted > 0 ? delivered / attempted : null;

  let providerStatus: CommunicationHealthSnapshot["providerStatus"] = "stub";
  if (isSendchampConfigured()) {
    providerStatus = circuit.state === "open" ? "circuit_open" : "ready";
  }

  return {
    providerMode: sendchampAdapterMode(),
    keysConfigured: isSendchampConfigured(),
    smsSent,
    whatsappSent,
    failures,
    retries,
    deadLettered,
    deliveryRate,
    latencyMs: snap.derived.processingLatencyMs,
    circuit: { state: circuit.state, failures: circuit.failures },
    providerStatus,
    generatedAt: new Date().toISOString(),
  };
}
