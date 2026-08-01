/**
 * VisibilityFilter — private / organization / public passport views.
 * Sensitive internal details never appear in public.
 */

import type {
  PassportVisibility,
  TrustPassport,
} from "@/lib/trust/passport/types";

function filterBadges(
  passport: TrustPassport,
  visibility: PassportVisibility,
): TrustPassport["badges"] {
  return passport.badges
    .filter((b) => b.visibility.includes(visibility))
    .map((b) =>
      visibility === "public" && !b.earned
        ? { ...b, description: "" }
        : b,
    );
}

/**
 * Apply visibility rules. Mutates a shallow copy — does not touch TrustProfile.
 */
export function applyPassportVisibility(
  passport: TrustPassport,
  visibility: PassportVisibility,
): TrustPassport {
  const base: TrustPassport = {
    ...passport,
    visibility,
    badges: filterBadges(passport, visibility),
    identity: {
      ...passport.identity,
      badges: passport.identity.badges.filter((b) =>
        b.visibility.includes(visibility),
      ),
    },
  };

  if (visibility === "private") {
    return base;
  }

  if (visibility === "organization") {
    return {
      ...base,
      // Orgs see guidance and most timeline, but not raw internal warning dumps beyond engine warnings
      warnings: passport.warnings.slice(0, 3),
      reasons: passport.reasons.slice(0, 5),
      guidance: passport.guidance.slice(0, 4),
      timeline: passport.timeline.slice(0, 12),
      achievements: passport.achievements.filter((a) => a.earned),
    };
  }

  // public — minimal shareable surface
  return {
    ...base,
    warnings: [],
    reasons: [],
    guidance: [],
    timeline: [],
    achievements: passport.achievements
      .filter((a) => a.earned)
      .slice(0, 5)
      .map((a) => ({ ...a, description: "" })),
    dimensions: passport.dimensions.map((d) => ({
      ...d,
      explanation: "",
    })),
    identity: {
      ...base.identity,
      // Keep verification flags; hide org-internal verification nuance
      badges: base.identity.badges.filter((b) => b.earned),
    },
    badges: filterBadges(passport, "public").filter((b) => b.earned),
  };
}
