/**
 * Admin Automation Health — workflow engine observability (4.4A).
 */

import "server-only";

import {
  isAutomationEngineEnabled,
  isAutomationRulesEnabled,
  isAutomationActionsEnabled,
  AUTOMATION_ENGINE_MODEL_VERSION,
} from "@/lib/automation/config";
import { getAutomationTelemetrySnapshot } from "@/lib/automation/telemetry";
import {
  countActiveRules,
  listDeadLetters,
  listRules,
} from "@/lib/automation/store";
import { listTriggers } from "@/lib/automation/trigger-registry";
import { listActions } from "@/lib/automation/action-registry";

export type AutomationHealthSnapshot = {
  automationEngineEnabled: boolean;
  rulesEnabled: boolean;
  actionsEnabled: boolean;
  modelVersion: string;
  activeRules: number;
  totalRules: number;
  triggersRegistered: number;
  actionsRegistered: number;
  executions: number;
  executionsPerHour: number;
  successRate: number;
  retries: number;
  deadLetter: number;
  averageLatencyMs: number;
  failures: number;
  dryRuns: number;
  byTrigger: Record<string, number>;
  generatedAt: string;
};

export async function getAutomationHealthSnapshot(): Promise<AutomationHealthSnapshot> {
  const telemetry = getAutomationTelemetrySnapshot();
  return {
    automationEngineEnabled: isAutomationEngineEnabled(),
    rulesEnabled: isAutomationRulesEnabled(),
    actionsEnabled: isAutomationActionsEnabled(),
    modelVersion: AUTOMATION_ENGINE_MODEL_VERSION,
    activeRules: countActiveRules(),
    totalRules: listRules().length,
    triggersRegistered: listTriggers().length,
    actionsRegistered: listActions().length,
    executions: telemetry.executions,
    executionsPerHour: telemetry.executionsPerHourEstimate,
    successRate: Math.round(telemetry.successRate * 1000) / 1000,
    retries: telemetry.retries,
    deadLetter: listDeadLetters().length || telemetry.deadLetters,
    averageLatencyMs: telemetry.averageLatencyMs,
    failures: telemetry.failures,
    dryRuns: telemetry.dryRuns,
    byTrigger: telemetry.byTrigger,
    generatedAt: new Date().toISOString(),
  };
}
