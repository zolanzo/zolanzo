/**
 * Integration Marketplace runtime flags — Phase 4.5C.
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

/** Master marketplace switch. Default: on when PUBLIC_API on. */
export function isIntegrationMarketplaceEnabled(): boolean {
  if (!isPublicApiEnabled()) return false;
  if (falsy(process.env.INTEGRATION_MARKETPLACE)) return false;
  if (truthy(process.env.INTEGRATION_MARKETPLACE)) return true;
  return true;
}

/** Connector runtime (sync / invoke). Default: on when marketplace on. */
export function isConnectorRuntimeEnabled(): boolean {
  if (!isIntegrationMarketplaceEnabled()) return false;
  if (falsy(process.env.CONNECTOR_RUNTIME)) return false;
  if (truthy(process.env.CONNECTOR_RUNTIME)) return true;
  return true;
}

/** Connector health probes. Default: on when marketplace on. */
export function isConnectorHealthEnabled(): boolean {
  if (!isIntegrationMarketplaceEnabled()) return false;
  if (falsy(process.env.CONNECTOR_HEALTH)) return false;
  if (truthy(process.env.CONNECTOR_HEALTH)) return true;
  return true;
}

export { INTEGRATION_MARKETPLACE_MODEL_VERSION } from "@/lib/marketplace/types";
