/**
 * Schedule helpers — timezone-aware publish targeting.
 */

import type { ScheduleMode } from "@/constants/campaign-schedule";

export type ScheduleValidationInput = {
  mode: ScheduleMode;
  timezone: string;
  startAt?: string | null;
  endAt?: string | null;
  recurrenceRule?: string | null;
  now?: Date;
};

export type ScheduleValidationResult = {
  ok: boolean;
  errors: string[];
  /** Status to enter after a successful publish */
  publishTarget: "scheduled" | "active";
};

/**
 * Validates schedule fields. Does not generate tasks or jobs.
 */
export function validateCampaignSchedule(
  input: ScheduleValidationInput,
): ScheduleValidationResult {
  const errors: string[] = [];
  const now = input.now ?? new Date();

  if (!input.timezone?.trim()) {
    errors.push("timezone is required");
  }

  if (input.mode === "scheduled") {
    if (!input.startAt) {
      errors.push("startAt is required for scheduled campaigns");
    } else {
      const start = new Date(input.startAt);
      if (Number.isNaN(start.getTime())) {
        errors.push("startAt is invalid");
      }
    }
  }

  if (input.mode === "recurring_future") {
    if (!input.recurrenceRule?.trim()) {
      errors.push("recurrenceRule is required for recurring_future (declarative)");
    }
    if (!input.startAt) {
      errors.push("startAt is required for recurring_future");
    }
  }

  if (input.startAt && input.endAt) {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end <= start) {
        errors.push("endAt must be after startAt");
      }
    }
  }

  let publishTarget: "scheduled" | "active" = "active";
  if (input.mode === "scheduled" || input.mode === "recurring_future") {
    publishTarget = "scheduled";
    if (input.startAt) {
      const start = new Date(input.startAt);
      if (!Number.isNaN(start.getTime()) && start <= now) {
        publishTarget = "active";
      }
    }
  } else {
    publishTarget = "active";
  }

  return {
    ok: errors.length === 0,
    errors,
    publishTarget,
  };
}
