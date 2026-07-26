import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

/**
 * GPS Validator — placeholder for geofence / coordinate verification (future).
 */
export const gpsValidator: Validator = {
  name: "gps",
  validate(ctx) {
    const startedAt = Date.now();
    const gpsItems = ctx.evidenceSnapshot.filter((i) => i.kind === "gps");
    const hasSnapshot = Boolean(ctx.submission.gpsSnapshot);
    const requireGps = ctx.profile.config?.requireGps === true;

    if (!requireGps && gpsItems.length === 0 && !hasSnapshot) {
      return makeResult({
        name: "gps",
        status: "skipped",
        score: null,
        startedAt,
        messages: ["GPS not required and no GPS evidence present"],
      });
    }

    if (requireGps && gpsItems.length === 0 && !hasSnapshot) {
      return makeResult({
        name: "gps",
        status: "fail",
        score: 0,
        startedAt,
        messages: ["Profile requires GPS evidence or snapshot"],
      });
    }

    // Placeholder: presence check only — geofence in later sprint
    return makeResult({
      name: "gps",
      status: "warning",
      score: 80,
      startedAt,
      messages: [
        "GPS present — geofence verification not yet implemented (placeholder)",
      ],
      metadata: {
        gpsItemCount: gpsItems.length,
        hasSubmissionSnapshot: hasSnapshot,
      },
    });
  },
};
