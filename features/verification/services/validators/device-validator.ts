import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

/**
 * Device Validator — placeholder for device fingerprint / platform checks (future).
 */
export const deviceValidator: Validator = {
  name: "device",
  validate(ctx) {
    const startedAt = Date.now();
    const requireDevice = ctx.profile.config?.requireDeviceSnapshot === true;
    const hasSnapshot = Boolean(ctx.submission.deviceSnapshot);
    const contextPlatforms = ctx.executionContext.device.platforms;

    if (!requireDevice && !hasSnapshot) {
      return makeResult({
        name: "device",
        status: "skipped",
        score: null,
        startedAt,
        messages: ["Device snapshot not required"],
      });
    }

    if (requireDevice && !hasSnapshot) {
      return makeResult({
        name: "device",
        status: "warning",
        score: 50,
        startedAt,
        messages: [
          "Profile prefers device snapshot — missing (placeholder soft fail)",
        ],
        metadata: { contextPlatforms },
      });
    }

    return makeResult({
      name: "device",
      status: "warning",
      score: 85,
      startedAt,
      messages: [
        "Device data present — fingerprint verification not yet implemented (placeholder)",
      ],
      metadata: {
        hasSubmissionSnapshot: hasSnapshot,
        contextPlatforms,
      },
    });
  },
};
