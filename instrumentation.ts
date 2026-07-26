/**
 * Next.js instrumentation — optionally start the in-process cron runner.
 * Enable with ZOLANZO_CRON_ENABLED=1 (default off; prefer `npm run jobs:cron`).
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startEmbeddedCron } = await import("./instrumentation.node");
    await startEmbeddedCron();
  }
}
