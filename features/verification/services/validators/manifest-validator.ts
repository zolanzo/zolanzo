import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

export const manifestValidator: Validator = {
  name: "manifest",
  validate(ctx) {
    const startedAt = Date.now();
    const messages: string[] = [];
    if (!ctx.manifest.finalized) {
      messages.push("Evidence manifest is not finalized");
    }
    if (ctx.evidenceSnapshot.length === 0) {
      messages.push("Evidence manifest has no items");
    }
    if (messages.length > 0) {
      return makeResult({
        name: "manifest",
        status: "fail",
        score: 0,
        startedAt,
        messages,
        metadata: { itemCount: ctx.evidenceSnapshot.length },
      });
    }
    return makeResult({
      name: "manifest",
      status: "pass",
      score: 100,
      startedAt,
      messages: ["Manifest finalized with evidence"],
      metadata: {
        itemCount: ctx.evidenceSnapshot.length,
        version: ctx.manifest.version,
      },
    });
  },
};
