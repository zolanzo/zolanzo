/**
 * Admin Passport Health.
 */

import "server-only";

import {
  isTrustPassportEnabled,
  isTrustBadgesEnabled,
  isTrustTimelineEnabled,
  TRUST_PASSPORT_MODEL_VERSION,
} from "@/lib/trust/passport/config";
import { getPassportTelemetrySnapshot } from "@/lib/trust/passport/passport-telemetry";

export type PassportHealthSnapshot = {
  passportEnabled: boolean;
  badgesEnabled: boolean;
  timelineEnabled: boolean;
  modelVersion: string;
  passportsGenerated: number;
  badgeDistribution: Record<string, number>;
  timelineEventsProcessed: number;
  averageLatencyMs: number;
  lastLatencyMs: number | null;
  visibilityUsage: Record<string, number>;
  failures: number;
  errorRate: number;
  generatedAt: string;
};

export async function getPassportHealthSnapshot(): Promise<PassportHealthSnapshot> {
  const telemetry = getPassportTelemetrySnapshot();
  return {
    passportEnabled: isTrustPassportEnabled(),
    badgesEnabled: isTrustBadgesEnabled(),
    timelineEnabled: isTrustTimelineEnabled(),
    modelVersion: TRUST_PASSPORT_MODEL_VERSION,
    passportsGenerated: telemetry.generated,
    badgeDistribution: telemetry.badgeEarnCounts,
    timelineEventsProcessed: telemetry.timelineEventsEmitted,
    averageLatencyMs: telemetry.averageLatencyMs,
    lastLatencyMs: telemetry.lastLatencyMs,
    visibilityUsage: telemetry.visibilityCounts,
    failures: telemetry.failures,
    errorRate: telemetry.errorRate,
    generatedAt: new Date().toISOString(),
  };
}
