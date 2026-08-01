/**
 * Passport telemetry — Admin Passport Health.
 */

type PassportHealthCounters = {
  generated: number;
  failures: number;
  totalLatencyMs: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  badgeEarnCounts: Record<string, number>;
  timelineEventsEmitted: number;
  visibilityCounts: Record<string, number>;
};

const counters: PassportHealthCounters = {
  generated: 0,
  failures: 0,
  totalLatencyMs: 0,
  lastLatencyMs: null,
  lastAt: null,
  badgeEarnCounts: {},
  timelineEventsEmitted: 0,
  visibilityCounts: {
    private: 0,
    organization: 0,
    public: 0,
  },
};

export function recordPassportGeneration(event: {
  success: boolean;
  latencyMs: number;
  visibility: string;
  badgesEarned?: string[];
  timelineCount?: number;
}): void {
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (!event.success) {
    counters.failures += 1;
    return;
  }
  counters.generated += 1;
  counters.visibilityCounts[event.visibility] =
    (counters.visibilityCounts[event.visibility] ?? 0) + 1;
  counters.timelineEventsEmitted += event.timelineCount ?? 0;
  for (const code of event.badgesEarned ?? []) {
    counters.badgeEarnCounts[code] =
      (counters.badgeEarnCounts[code] ?? 0) + 1;
  }
}

export function getPassportTelemetrySnapshot(): PassportHealthCounters & {
  averageLatencyMs: number;
  errorRate: number;
} {
  return {
    ...counters,
    badgeEarnCounts: { ...counters.badgeEarnCounts },
    visibilityCounts: { ...counters.visibilityCounts },
    averageLatencyMs:
      counters.generated + counters.failures > 0
        ? Math.round(
            counters.totalLatencyMs /
              (counters.generated + counters.failures),
          )
        : 0,
    errorRate:
      counters.generated + counters.failures > 0
        ? counters.failures / (counters.generated + counters.failures)
        : 0,
  };
}

export function resetPassportTelemetryForTests(): void {
  counters.generated = 0;
  counters.failures = 0;
  counters.totalLatencyMs = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.badgeEarnCounts = {};
  counters.timelineEventsEmitted = 0;
  counters.visibilityCounts = {
    private: 0,
    organization: 0,
    public: 0,
  };
}
