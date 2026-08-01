/**
 * Automation runtime flags — Phase 4.4A.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch. Default: on. */
export function isAutomationEngineEnabled(): boolean {
  if (falsy(process.env.AUTOMATION_ENGINE)) return false;
  if (truthy(process.env.AUTOMATION_ENGINE)) return true;
  return true;
}

/** Rule CRUD / evaluation. Default: on when engine on. */
export function isAutomationRulesEnabled(): boolean {
  if (!isAutomationEngineEnabled()) return false;
  if (falsy(process.env.AUTOMATION_RULES)) return false;
  if (truthy(process.env.AUTOMATION_RULES)) return true;
  return true;
}

/** Action dispatch to domain services. Default: on when engine on. */
export function isAutomationActionsEnabled(): boolean {
  if (!isAutomationEngineEnabled()) return false;
  if (falsy(process.env.AUTOMATION_ACTIONS)) return false;
  if (truthy(process.env.AUTOMATION_ACTIONS)) return true;
  return true;
}

export const AUTOMATION_MAX_ATTEMPTS = (() => {
  const n = Number(process.env.AUTOMATION_MAX_ATTEMPTS ?? "3");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
})();

export const AUTOMATION_ACTION_TIMEOUT_MS = (() => {
  const n = Number(process.env.AUTOMATION_ACTION_TIMEOUT_MS ?? "5000");
  return Number.isFinite(n) && n > 0 ? n : 5000;
})();

export { AUTOMATION_ENGINE_MODEL_VERSION } from "@/lib/automation/types";
