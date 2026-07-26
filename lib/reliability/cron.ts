/**
 * Minimal UTC 5-field cron matcher (minute hour dom month dow).
 * Supports star, lists, ranges, and step values (e.g. every N minutes).
 */

export type CronParts = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

export function parseCronExpression(expr: string): CronParts {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression (need 5 fields): ${expr}`);
  }
  return {
    minute: parts[0]!,
    hour: parts[1]!,
    dayOfMonth: parts[2]!,
    month: parts[3]!,
    dayOfWeek: parts[4]!,
  };
}

function matchField(
  field: string,
  value: number,
  min: number,
  max: number,
): boolean {
  const segments = field.split(",");
  return segments.some((segment) => matchSegment(segment, value, min, max));
}

function matchSegment(
  segment: string,
  value: number,
  min: number,
  max: number,
): boolean {
  const stepParts = segment.split("/");
  const rangePart = stepParts[0]!;
  const step = stepParts[1] ? Number(stepParts[1]) : 1;
  if (!Number.isFinite(step) || step <= 0) return false;

  let start = min;
  let end = max;

  if (rangePart === "*") {
    // full range
  } else if (rangePart.includes("-")) {
    const [a, b] = rangePart.split("-");
    start = Number(a);
    end = Number(b);
  } else {
    start = Number(rangePart);
    end = start;
  }

  if (![start, end].every((n) => Number.isFinite(n))) return false;
  if (value < start || value > end) return false;
  return (value - start) % step === 0;
}

/**
 * Returns true when `date` (UTC) matches the cron expression.
 */
export function cronMatchesUtc(expr: string, date: Date = new Date()): boolean {
  const parts = parseCronExpression(expr);
  const minute = date.getUTCMinutes();
  const hour = date.getUTCHours();
  const dayOfMonth = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  // Sunday=0 … Saturday=6 (standard). Also accept 7 as Sunday in field.
  const dayOfWeek = date.getUTCDay();

  const dowField = parts.dayOfWeek.replace(/\b7\b/g, "0");

  return (
    matchField(parts.minute, minute, 0, 59) &&
    matchField(parts.hour, hour, 0, 23) &&
    matchField(parts.dayOfMonth, dayOfMonth, 1, 31) &&
    matchField(parts.month, month, 1, 12) &&
    matchField(dowField, dayOfWeek, 0, 6)
  );
}

/** Stable key for “already fired this UTC minute” dedupe */
export function cronFireKey(job: string, date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${job}:${y}${m}${d}${h}${min}`;
}
