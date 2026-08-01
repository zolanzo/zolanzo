/**
 * GuidanceBuilder — actionable advice from Trust Engine explanations + dimensions.
 * Does not invent new scoring logic.
 */

import type { PassportBuildInput } from "@/lib/trust/passport/types";

export function buildPassportGuidance(input: PassportBuildInput): string[] {
  const tips: string[] = [];
  const { profile, identity, stats } = input;

  // Prefer engine warnings / reasons first
  for (const w of profile.warnings.slice(0, 3)) {
    tips.push(w);
  }

  if (!identity.emailVerified || !identity.phoneVerified) {
    tips.push("Complete identity verification (email and phone).");
  }
  if (!identity.governmentIdVerified) {
    tips.push("Complete government ID verification when available.");
  }
  if (profile.dimensions.reliability < 80) {
    tips.push("Improve on-time completion and deadline adherence.");
  }
  if (stats.revisionRequestCount > 0 || profile.dimensions.quality < 85) {
    tips.push("Reduce revision requests by double-checking evidence before submit.");
  }
  if (stats.approvalRate < 0.95) {
    tips.push("Maintain approval rate above 95%.");
  }
  if (profile.dimensions.experience < 60) {
    tips.push("Build experience by completing more diverse campaigns.");
  }
  if (profile.trend === "declining") {
    tips.push("Focus on recent quality — trust trend is declining.");
  }

  // Dedupe
  return [...new Set(tips)].slice(0, 6);
}
