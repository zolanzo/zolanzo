/**
 * Fire-and-forget automation ingest — never fails domain flows.
 */

import "server-only";

import { isAutomationEngineEnabled } from "@/lib/automation/config";
import { ingestAutomationEvent } from "@/lib/automation/automation-service";
import type { AutomationTriggerType } from "@/lib/automation/types";
import { logger } from "@/lib/observability/logger";

export async function safeRecordAutomationEvent(input: {
  trigger: AutomationTriggerType;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  organizationId?: string | null;
  campaignId?: string | null;
  userId?: string | null;
  correlationId?: string;
  span?: string;
}): Promise<void> {
  if (!isAutomationEngineEnabled()) return;
  try {
    await ingestAutomationEvent(input);
  } catch (error) {
    logger.warn("Automation event ingest failed", {
      span: input.span ?? "automation.domain_emit",
      trigger: input.trigger,
      idempotencyKey: input.idempotencyKey,
      err:
        error instanceof Error
          ? { message: error.message }
          : { message: String(error) },
    });
  }
}
