/**
 * Automation telemetry — Admin Automation Health.
 */

import type { AutomationHealthCounters } from "@/lib/automation/types";

const counters: AutomationHealthCounters = {
  executions: 0,
  successes: 0,
  failures: 0,
  retries: 0,
  dryRuns: 0,
  deadLetters: 0,
  totalLatencyMs: 0,
  lastLatencyMs: null,
  lastAt: null,
  byTrigger: {},
};

export function recordAutomationExecution(event: {
  trigger: string;
  success: boolean;
  dryRun?: boolean;
  retry?: boolean;
  deadLetter?: boolean;
  latencyMs: number;
}): void {
  counters.executions += 1;
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  counters.byTrigger[event.trigger] =
    (counters.byTrigger[event.trigger] ?? 0) + 1;
  if (event.dryRun) counters.dryRuns += 1;
  if (event.retry) counters.retries += 1;
  if (event.deadLetter) {
    counters.deadLetters += 1;
    counters.failures += 1;
    return;
  }
  if (event.success) counters.successes += 1;
  else counters.failures += 1;
}

export function getAutomationTelemetrySnapshot(): AutomationHealthCounters & {
  averageLatencyMs: number;
  successRate: number;
  executionsPerHourEstimate: number;
} {
  return {
    ...counters,
    byTrigger: { ...counters.byTrigger },
    averageLatencyMs:
      counters.executions > 0
        ? Math.round(counters.totalLatencyMs / counters.executions)
        : 0,
    successRate:
      counters.executions > 0
        ? counters.successes / counters.executions
        : 0,
    executionsPerHourEstimate: counters.executions,
  };
}

export function resetAutomationTelemetryForTests(): void {
  counters.executions = 0;
  counters.successes = 0;
  counters.failures = 0;
  counters.retries = 0;
  counters.dryRuns = 0;
  counters.deadLetters = 0;
  counters.totalLatencyMs = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.byTrigger = {};
}
