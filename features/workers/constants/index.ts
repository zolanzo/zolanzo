/**
 * Worker profile architecture constants.
 */

export const WORKER_AVAILABILITY = [
  "full_time",
  "part_time",
  "flexible",
  "unavailable",
] as const;

export const WORKER_ENTITIES = ["WorkerProfile", "WorkerDevice", "WorkerSkill"] as const;
