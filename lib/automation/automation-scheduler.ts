/**
 * AutomationScheduler — drain retries / periodic rule maintenance.
 */

import { isAutomationEngineEnabled } from "@/lib/automation/config";
import { processAutomationEvent } from "@/lib/automation/automation-engine";
import { drainDueRetries } from "@/lib/automation/store";

export async function runAutomationScheduler(now = Date.now()): Promise<{
  retried: number;
  succeeded: number;
  failed: number;
}> {
  if (!isAutomationEngineEnabled()) {
    return { retried: 0, succeeded: 0, failed: 0 };
  }
  const due = drainDueRetries(now);
  let succeeded = 0;
  let failed = 0;
  for (const item of due) {
    const result = await processAutomationEvent(item.event, {
      attempt: item.attempt,
    });
    const ok = result.executions.every(
      (e) =>
        e.status === "success" ||
        e.status === "dry_run" ||
        e.status === "skipped",
    );
    if (ok) succeeded += 1;
    else failed += 1;
  }
  return { retried: due.length, succeeded, failed };
}

export const AutomationScheduler = {
  run: runAutomationScheduler,
};
