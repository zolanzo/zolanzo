import type { ManifestEvidenceKind } from "@/constants/work-states";
import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

const KIND_RULES: Record<string, ManifestEvidenceKind> = {
  require_image: "image",
  require_video: "video",
  require_audio: "audio",
  require_text: "text",
  require_json: "json",
  require_gps: "gps",
  require_file: "file",
  require_link: "link",
  require_screen_recording: "screen_recording",
};

export const ruleValidator: Validator = {
  name: "rule",
  validate(ctx) {
    const startedAt = Date.now();
    const ruleKeys = ctx.profile.ruleKeys ?? [];
    if (ruleKeys.length === 0) {
      return makeResult({
        name: "rule",
        status: "skipped",
        score: null,
        startedAt,
        messages: ["No rule keys configured for profile"],
      });
    }

    const kinds = new Set(ctx.evidenceSnapshot.map((i) => i.kind));
    const failures: string[] = [];
    const messages: string[] = [];

    for (const key of ruleKeys) {
      if (key === "min_evidence_count") {
        const min = ctx.profile.config?.minEvidenceCount ?? 1;
        if (ctx.evidenceSnapshot.length < min) {
          failures.push(
            `min_evidence_count: need ${min}, have ${ctx.evidenceSnapshot.length}`,
          );
        } else {
          messages.push(`min_evidence_count satisfied (${min})`);
        }
        continue;
      }

      const kind = KIND_RULES[key];
      if (!kind) {
        messages.push(`Unknown rule key skipped: ${key}`);
        continue;
      }
      if (!kinds.has(kind)) {
        failures.push(`Rule ${key} failed: missing ${kind} evidence`);
      } else {
        messages.push(`Rule ${key} passed`);
      }
    }

    if (failures.length > 0) {
      return makeResult({
        name: "rule",
        status: "fail",
        score: 0,
        startedAt,
        messages: failures,
        metadata: { ruleKeys: [...ruleKeys] },
      });
    }

    return makeResult({
      name: "rule",
      status: "pass",
      score: 100,
      startedAt,
      messages: messages.length ? messages : ["All profile rules passed"],
      metadata: { ruleKeys: [...ruleKeys] },
    });
  },
};
