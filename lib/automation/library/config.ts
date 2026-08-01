/**
 * Automation Library runtime flags — Phase 4.4B.
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

/** Master library switch. Default: on when automation engine on. */
export function isAutomationLibraryEnabled(): boolean {
  if (!isAutomationEngineEnabled()) return false;
  if (falsy(process.env.AUTOMATION_LIBRARY)) return false;
  if (truthy(process.env.AUTOMATION_LIBRARY)) return true;
  return true;
}

/** Template install / generation. Default: on when library on. */
export function isAutomationTemplatesEnabled(): boolean {
  if (!isAutomationLibraryEnabled()) return false;
  if (falsy(process.env.AUTOMATION_TEMPLATES)) return false;
  if (truthy(process.env.AUTOMATION_TEMPLATES)) return true;
  return true;
}

export { AUTOMATION_LIBRARY_MODEL_VERSION } from "@/lib/automation/library/types";
