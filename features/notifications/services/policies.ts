/**
 * Delivery policy evaluation — schedule, quiet hours, retry, digest (future).
 */

import type {
  DeliveryPolicyMode,
  DigestFrequency,
} from "@/constants/notification";

export type QuietHoursConfig = {
  start: string; // HH:mm
  end: string; // HH:mm
};

export type RetryConfig = {
  maxAttempts: number;
  backoffSeconds: number;
};

export type DeliveryPolicyConfig = {
  mode: DeliveryPolicyMode;
  delaySeconds?: number;
  scheduledAt?: string;
  quietHours?: QuietHoursConfig;
  retry?: RetryConfig;
  digestFrequency?: DigestFrequency;
  batchWindowSeconds?: number;
};

export type PolicySnapshot = DeliveryPolicyConfig & {
  policyKey: string;
  evaluatedAt: string;
  timezone: string;
};

export type ScheduleResult = {
  scheduledAt: Date;
  suppressed: boolean;
  reason?: string;
  deferredForQuietHours: boolean;
  deferredForDnd: boolean;
  digestDeferred: boolean;
};

function parseHm(hm: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hm);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/** Minutes from midnight in a given IANA timezone. */
export function localMinutesOfDay(when: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(when);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function isWithinWindow(
  minutes: number,
  startHm: string,
  endHm: string,
): boolean {
  const start = parseHm(startHm);
  const end = parseHm(endHm);
  if (!start || !end) return false;
  const startMin = start.hour * 60 + start.minute;
  const endMin = end.hour * 60 + end.minute;
  if (startMin === endMin) return true;
  if (startMin < endMin) {
    return minutes >= startMin && minutes < endMin;
  }
  // Overnight window (e.g. 22:00–07:00)
  return minutes >= startMin || minutes < endMin;
}

/** Next local time matching HH:mm in timezone, at or after `from`. */
export function nextLocalDateTime(
  from: Date,
  hm: string,
  timeZone: string,
): Date {
  const parsed = parseHm(hm);
  if (!parsed) return from;

  // Iterate hour-by-hour up to 48h to find the next matching local minute.
  const target = parsed.hour * 60 + parsed.minute;
  let cursor = new Date(from.getTime());
  for (let i = 0; i < 48 * 60; i += 1) {
    if (localMinutesOfDay(cursor, timeZone) === target) {
      return cursor;
    }
    cursor = new Date(cursor.getTime() + 60_000);
  }
  return new Date(from.getTime() + 60 * 60_000);
}

export function evaluateDeliverySchedule(params: {
  policy: DeliveryPolicyConfig;
  now?: Date;
  timezone: string;
  dndWindows?: QuietHoursConfig[];
}): ScheduleResult {
  const now = params.now ?? new Date();
  const tz = params.timezone || "UTC";
  let scheduledAt = now;
  let deferredForQuietHours = false;
  let deferredForDnd = false;
  let digestDeferred = false;

  switch (params.policy.mode) {
    case "immediate":
      scheduledAt = now;
      break;
    case "delayed":
      scheduledAt = new Date(
        now.getTime() + (params.policy.delaySeconds ?? 0) * 1000,
      );
      break;
    case "scheduled":
      scheduledAt = params.policy.scheduledAt
        ? new Date(params.policy.scheduledAt)
        : now;
      break;
    case "batch":
      scheduledAt = new Date(
        now.getTime() + (params.policy.batchWindowSeconds ?? 300) * 1000,
      );
      break;
    case "digest":
      digestDeferred = true;
      scheduledAt = new Date(now.getTime() + 24 * 60 * 60_000);
      break;
    case "quiet_hours":
    case "retry":
      scheduledAt = now;
      break;
    default:
      scheduledAt = now;
  }

  const quiet = params.policy.quietHours;
  if (quiet) {
    const minutes = localMinutesOfDay(scheduledAt, tz);
    if (isWithinWindow(minutes, quiet.start, quiet.end)) {
      scheduledAt = nextLocalDateTime(scheduledAt, quiet.end, tz);
      deferredForQuietHours = true;
    }
  }

  for (const window of params.dndWindows ?? []) {
    const minutes = localMinutesOfDay(scheduledAt, tz);
    if (isWithinWindow(minutes, window.start, window.end)) {
      scheduledAt = nextLocalDateTime(scheduledAt, window.end, tz);
      deferredForDnd = true;
    }
  }

  if (params.policy.mode === "digest") {
    return {
      scheduledAt,
      suppressed: false,
      deferredForQuietHours,
      deferredForDnd,
      digestDeferred: true,
      reason: "Digest mode — job scheduled for digest window (future-ready)",
    };
  }

  return {
    scheduledAt,
    suppressed: false,
    deferredForQuietHours,
    deferredForDnd,
    digestDeferred,
  };
}

export function computeRetrySchedule(params: {
  attempts: number;
  retry: RetryConfig;
  from?: Date;
}): { nextAt: Date; exhausted: boolean } {
  const from = params.from ?? new Date();
  if (params.attempts >= params.retry.maxAttempts) {
    return { nextAt: from, exhausted: true };
  }
  const delay =
    params.retry.backoffSeconds * Math.max(1, params.attempts) * 1000;
  return { nextAt: new Date(from.getTime() + delay), exhausted: false };
}

export const DEFAULT_POLICY: DeliveryPolicyConfig = {
  mode: "immediate",
  retry: { maxAttempts: 3, backoffSeconds: 60 },
};

export function buildPolicySnapshot(params: {
  policyKey: string;
  policy: DeliveryPolicyConfig;
  timezone: string;
  now?: Date;
}): PolicySnapshot {
  return {
    ...params.policy,
    policyKey: params.policyKey,
    evaluatedAt: (params.now ?? new Date()).toISOString(),
    timezone: params.timezone,
  };
}
