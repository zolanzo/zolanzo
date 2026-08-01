/**
 * Developer Portal runtime flags — Phase 4.5D.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

import { isPublicApiEnabled } from "@/lib/public-api/config";

/** Master developer portal switch. Default: on when PUBLIC_API on. */
export function isDeveloperPortalEnabled(): boolean {
  if (!isPublicApiEnabled()) return false;
  if (falsy(process.env.DEVELOPER_PORTAL)) return false;
  if (truthy(process.env.DEVELOPER_PORTAL)) return true;
  return true;
}

/** SDK generation from OpenAPI. Default: on when portal on. */
export function isSdkGenerationEnabled(): boolean {
  if (!isDeveloperPortalEnabled()) return false;
  if (falsy(process.env.SDK_GENERATION)) return false;
  if (truthy(process.env.SDK_GENERATION)) return true;
  return true;
}

/** Interactive API explorer. Default: on when portal on. */
export function isApiExplorerEnabled(): boolean {
  if (!isDeveloperPortalEnabled()) return false;
  if (falsy(process.env.API_EXPLORER)) return false;
  if (truthy(process.env.API_EXPLORER)) return true;
  return true;
}

export { DEVELOPER_PORTAL_MODEL_VERSION } from "@/lib/developer-portal/types";
