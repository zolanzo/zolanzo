/**
 * Campaign schedule modes.
 */

export const SCHEDULE_MODES = [
  "immediate",
  "scheduled",
  "recurring_future",
] as const;

export type ScheduleMode = (typeof SCHEDULE_MODES)[number];

export type CampaignSchedule = {
  mode: ScheduleMode;
  /** IANA timezone, e.g. Africa/Lagos */
  timezone: string;
  startAt?: string | null;
  endAt?: string | null;
  /** Future: RRULE / cron expression */
  recurrenceRule?: string | null;
};
