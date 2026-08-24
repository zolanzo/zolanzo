export type OpportunityPreferences = {
  preferredState: string | null;
  preferredCity: string | null;
  remotePreferred: boolean;
  minRewardMinor: number;
  preferredPlatforms: string[];
  preferredCategories: string[];
  availability: string[];
  matchingNotifications: boolean;
};

export type ProfileAddressJson = {
  state?: string | null;
  city?: string | null;
  country?: string | null;
  opportunity?: Partial<OpportunityPreferences>;
};

export const DEFAULT_OPPORTUNITY_PREFERENCES: OpportunityPreferences = {
  preferredState: null,
  preferredCity: null,
  remotePreferred: false,
  minRewardMinor: 0,
  preferredPlatforms: [],
  preferredCategories: [],
  availability: [],
  matchingNotifications: true,
};
