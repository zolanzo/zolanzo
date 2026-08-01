/**
 * Fire-and-forget analytics emit — never fails domain flows.
 * Analytics never mutates domain data.
 */

import "server-only";

import { isAnalyticsEngineEnabled } from "@/lib/analytics/config";
import { setAnalyticsBackend } from "@/lib/analytics/analytics-service";
import type { RecordAnalyticsEventInput } from "@/lib/analytics/types";
import { logger } from "@/lib/observability/logger";

export async function safeRecordAnalyticsEvent(
  input: RecordAnalyticsEventInput & { span?: string },
): Promise<void> {
  if (!isAnalyticsEngineEnabled()) return;
  try {
    setAnalyticsBackend("prisma");
    const { record } = await import("@/lib/analytics/analytics-service");
    await record(input);
  } catch (error) {
    logger.warn("Analytics event emit failed", {
      span: input.span ?? "analytics.domain_emit",
      eventType: input.eventType,
      source: input.source,
      idempotencyKey: input.idempotencyKey,
      err:
        error instanceof Error
          ? { message: error.message }
          : { message: String(error) },
    });
  }
}
