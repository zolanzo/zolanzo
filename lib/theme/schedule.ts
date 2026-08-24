import {
  AUTO_LIGHT_END_HOUR,
  AUTO_LIGHT_START_HOUR,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme/constants";

export function resolveScheduledTheme(now: Date = new Date()): ResolvedTheme {
  const hour = now.getHours();
  return hour >= AUTO_LIGHT_START_HOUR && hour < AUTO_LIGHT_END_HOUR
    ? "light"
    : "dark";
}

export function nextScheduleBoundary(now: Date = new Date()): Date {
  const next = new Date(now.getTime());
  const hour = now.getHours();

  if (hour >= AUTO_LIGHT_START_HOUR && hour < AUTO_LIGHT_END_HOUR) {
    next.setHours(AUTO_LIGHT_END_HOUR, 0, 0, 0);
  } else if (hour >= AUTO_LIGHT_END_HOUR) {
    next.setDate(next.getDate() + 1);
    next.setHours(AUTO_LIGHT_START_HOUR, 0, 0, 0);
  } else {
    next.setHours(AUTO_LIGHT_START_HOUR, 0, 0, 0);
  }

  return next;
}

export function msUntilNextScheduleBoundary(now: Date = new Date()): number {
  return Math.max(nextScheduleBoundary(now).getTime() - now.getTime(), 1_000);
}

function parseStoredMode(value: string | null | undefined): ThemeMode | null {
  if (value === "light" || value === "dark") {
    return value;
  }
  return null;
}

/**
 * Scheduled Light (6:00–17:59) / Dark (18:00–05:59) unless a manual override
 * is still inside its current 6 AM / 6 PM window.
 */
export function resolveEffectiveTheme(
  stored: string | null | undefined,
  overrideUntil: number | null | undefined,
  now: Date = new Date(),
): ResolvedTheme {
  const scheduled = resolveScheduledTheme(now);
  const mode = parseStoredMode(stored);
  const until =
    typeof overrideUntil === "number" && Number.isFinite(overrideUntil)
      ? overrideUntil
      : null;

  if (mode && until != null && now.getTime() < until) {
    return mode;
  }

  // Legacy always-on Light/Dark (no expiry): keep it only for this window.
  if (mode && until == null && mode !== scheduled) {
    return mode;
  }

  return scheduled;
}
