/**
 * Standalone cron process entrypoint.
 *
 *   npm run jobs:cron
 *
 * Set ZOLANZO_CRON_ENABLED=0 to no-op (useful in containers that share the image).
 */

import { bootstrapJobRunner } from "@/jobs/runner";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("jobs.cron-main");

async function main(): Promise<void> {
  if (process.env.ZOLANZO_CRON_ENABLED === "0") {
    log.info("Cron runner disabled via ZOLANZO_CRON_ENABLED=0");
    return;
  }

  const runner = bootstrapJobRunner();
  runner.start();
  // Keep process alive
  setInterval(() => {
    /* heartbeat */
  }, 60_000).unref();

  const shutdown = async (signal: string) => {
    log.info("Received shutdown signal", { signal });
    await runner.shutdown(30_000);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  log.info("Cron process running");
}

void main().catch((error) => {
  log.error("Cron process crashed", {
    err:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { message: String(error) },
  });
  process.exit(1);
});
