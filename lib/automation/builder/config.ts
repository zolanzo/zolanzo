/**
 * Visual Rule Builder runtime flags — Phase 4.4C.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

import { isAutomationEngineEnabled } from "@/lib/automation/config";

/** Master builder switch. Default: on when automation engine on. */
export function isAutomationBuilderEnabled(): boolean {
  if (!isAutomationEngineEnabled()) return false;
  if (falsy(process.env.AUTOMATION_BUILDER)) return false;
  if (truthy(process.env.AUTOMATION_BUILDER)) return true;
  return true;
}

/** Simulation / dry-run preview. Default: on when builder on. */
export function isAutomationSimulationEnabled(): boolean {
  if (!isAutomationBuilderEnabled()) return false;
  if (falsy(process.env.AUTOMATION_SIMULATION)) return false;
  if (truthy(process.env.AUTOMATION_SIMULATION)) return true;
  return true;
}

/** Import / export. Default: on when builder on. */
export function isAutomationImportExportEnabled(): boolean {
  if (!isAutomationBuilderEnabled()) return false;
  if (falsy(process.env.AUTOMATION_IMPORT_EXPORT)) return false;
  if (truthy(process.env.AUTOMATION_IMPORT_EXPORT)) return true;
  return true;
}

export { AUTOMATION_BUILDER_MODEL_VERSION } from "@/lib/automation/builder/types";
