/**
 * Node-only cron bootstrap (imported only from instrumentation when NEXT_RUNTIME=nodejs).
 */

export async function startEmbeddedCron(): Promise<void> {
  if (process.env.ZOLANZO_CRON_ENABLED !== "1") return;

  const { bootstrapJobRunner } = await import("@/jobs/runner");
  const runner = bootstrapJobRunner();
  runner.start();

  const shutdown = () => {
    void runner.shutdown(15_000);
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
