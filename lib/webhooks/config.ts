/**
 * Webhook runtime flags — Phase 4.5B.
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

/** Master webhook platform switch. Default: on when PUBLIC_API on. */
export function isPublicWebhooksEnabled(): boolean {
  if (!isPublicApiEnabled()) return false;
  if (falsy(process.env.PUBLIC_WEBHOOKS)) return false;
  if (truthy(process.env.PUBLIC_WEBHOOKS)) return true;
  return true;
}

/** Outbound delivery. Default: on when webhooks on. */
export function isWebhookDeliveryEnabled(): boolean {
  if (!isPublicWebhooksEnabled()) return false;
  if (falsy(process.env.WEBHOOK_DELIVERY)) return false;
  if (truthy(process.env.WEBHOOK_DELIVERY)) return true;
  return true;
}

/** Manual replay. Default: on when delivery on. */
export function isWebhookReplayEnabled(): boolean {
  if (!isWebhookDeliveryEnabled()) return false;
  if (falsy(process.env.WEBHOOK_REPLAY)) return false;
  if (truthy(process.env.WEBHOOK_REPLAY)) return true;
  return true;
}

export { WEBHOOK_MODEL_VERSION } from "@/lib/webhooks/types";
