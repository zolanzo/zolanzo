/**
 * Job runner public exports + bootstrap.
 */

import { registerAllJobHandlers } from "@/jobs/handlers/critical";
import {
  CronRunner,
  getCronRunner,
  resetCronRunner,
} from "@/jobs/runner/cron-runner";
import { executeRegisteredJob } from "@/jobs/runner/execute";
import {
  clearRegisteredJobs,
  getRegisteredJob,
  listRegisteredJobs,
  registerJob,
} from "@/jobs/runner/registry";

export function bootstrapJobRunner(): CronRunner {
  registerAllJobHandlers();
  return getCronRunner();
}

export {
  CronRunner,
  getCronRunner,
  resetCronRunner,
  executeRegisteredJob,
  clearRegisteredJobs,
  getRegisteredJob,
  listRegisteredJobs,
  registerJob,
  registerAllJobHandlers,
};
