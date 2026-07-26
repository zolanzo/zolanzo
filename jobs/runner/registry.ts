/**
 * Registered job handlers catalog.
 */

import type { JobName } from "@/jobs/names";
import type { RegisteredJob } from "@/jobs/runner/types";

const handlers = new Map<JobName, RegisteredJob>();

export function registerJob(job: RegisteredJob): void {
  handlers.set(job.name, job);
}

export function getRegisteredJob(name: JobName): RegisteredJob | undefined {
  return handlers.get(name);
}

export function listRegisteredJobs(): RegisteredJob[] {
  return [...handlers.values()];
}

export function clearRegisteredJobs(): void {
  handlers.clear();
}
