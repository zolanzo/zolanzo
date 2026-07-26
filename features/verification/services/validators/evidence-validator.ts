import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

const INLINE_KINDS = new Set(["text", "json", "gps", "link"]);

export const evidenceValidator: Validator = {
  name: "evidence",
  validate(ctx) {
    const startedAt = Date.now();
    const failures: string[] = [];
    const warnings: string[] = [];

    for (const item of ctx.evidenceSnapshot) {
      if (!item.label.trim()) {
        failures.push(`Evidence ${item.evidenceItemId} missing label`);
      }
      if (INLINE_KINDS.has(item.kind)) {
        if (item.inlinePayload === null || item.inlinePayload === undefined) {
          failures.push(
            `Inline evidence ${item.label} (${item.kind}) missing payload`,
          );
        }
      } else if (!item.contentHash) {
        warnings.push(
          `Blob evidence ${item.label} (${item.kind}) missing content hash`,
        );
      }
    }

    if (failures.length > 0) {
      return makeResult({
        name: "evidence",
        status: "fail",
        score: 0,
        startedAt,
        messages: failures,
      });
    }
    if (warnings.length > 0) {
      return makeResult({
        name: "evidence",
        status: "warning",
        score: 70,
        startedAt,
        messages: warnings,
      });
    }
    return makeResult({
      name: "evidence",
      status: "pass",
      score: 100,
      startedAt,
      messages: ["All evidence items structurally valid"],
      metadata: { count: ctx.evidenceSnapshot.length },
    });
  },
};
