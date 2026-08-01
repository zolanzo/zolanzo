/**
 * Fire-and-forget trust event emit — never fails domain flows.
 */

import "server-only";

import { recordEvent, type RecordTrustEventInput } from "@/lib/trust/trust-profile-service";
import { isTrustEngineEnabled } from "@/lib/trust/config";
import { logger } from "@/lib/observability/logger";

export async function safeRecordTrustEvent(
  input: RecordTrustEventInput & { span?: string },
): Promise<void> {
  if (!isTrustEngineEnabled()) return;
  try {
    await recordEvent(input);
  } catch (error) {
    logger.warn("Trust event emit failed", {
      span: input.span ?? "trust.domain_emit",
      eventType: input.eventType,
      subjectId: input.subjectId,
      idempotencyKey: input.idempotencyKey,
      err:
        error instanceof Error
          ? { message: error.message }
          : { message: String(error) },
    });
  }
}
