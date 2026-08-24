import {
  DEFAULT_OPPORTUNITY_PREFERENCES,
  type OpportunityPreferences,
  type ProfileAddressJson,
} from "@/features/settings/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parseAddressJson(value: unknown): ProfileAddressJson {
  const rec = asRecord(value);
  if (!rec) return {};
  const opportunity = asRecord(rec.opportunity);
  return {
    state: typeof rec.state === "string" ? rec.state : null,
    city: typeof rec.city === "string" ? rec.city : null,
    country: typeof rec.country === "string" ? rec.country : null,
    opportunity: opportunity
      ? {
          preferredState:
            typeof opportunity.preferredState === "string"
              ? opportunity.preferredState
              : null,
          preferredCity:
            typeof opportunity.preferredCity === "string"
              ? opportunity.preferredCity
              : null,
          remotePreferred: Boolean(opportunity.remotePreferred),
          minRewardMinor:
            typeof opportunity.minRewardMinor === "number"
              ? opportunity.minRewardMinor
              : 0,
          preferredPlatforms: asStringArray(opportunity.preferredPlatforms),
          preferredCategories: asStringArray(opportunity.preferredCategories),
          availability: asStringArray(opportunity.availability),
          matchingNotifications:
            opportunity.matchingNotifications === undefined
              ? true
              : Boolean(opportunity.matchingNotifications),
        }
      : undefined,
  };
}

export function readOpportunityPreferences(
  value: unknown,
): OpportunityPreferences {
  const parsed = parseAddressJson(value);
  return {
    ...DEFAULT_OPPORTUNITY_PREFERENCES,
    preferredState: parsed.opportunity?.preferredState ?? parsed.state ?? null,
    preferredCity: parsed.opportunity?.preferredCity ?? parsed.city ?? null,
    remotePreferred:
      parsed.opportunity?.remotePreferred ??
      DEFAULT_OPPORTUNITY_PREFERENCES.remotePreferred,
    minRewardMinor:
      parsed.opportunity?.minRewardMinor ??
      DEFAULT_OPPORTUNITY_PREFERENCES.minRewardMinor,
    preferredPlatforms: parsed.opportunity?.preferredPlatforms ?? [],
    preferredCategories: parsed.opportunity?.preferredCategories ?? [],
    availability: parsed.opportunity?.availability ?? [],
    matchingNotifications:
      parsed.opportunity?.matchingNotifications ??
      DEFAULT_OPPORTUNITY_PREFERENCES.matchingNotifications,
  };
}

export function mergeAddressJson(
  existing: unknown,
  patch: {
    state?: string | null;
    city?: string | null;
    country?: string | null;
    opportunity?: Partial<OpportunityPreferences>;
  },
): ProfileAddressJson {
  const current = parseAddressJson(existing);
  const nextOpportunity = {
    ...readOpportunityPreferences(existing),
    ...patch.opportunity,
  };
  return {
    state: patch.state !== undefined ? patch.state : (current.state ?? null),
    city: patch.city !== undefined ? patch.city : (current.city ?? null),
    country:
      patch.country !== undefined ? patch.country : (current.country ?? null),
    opportunity: nextOpportunity,
  };
}
