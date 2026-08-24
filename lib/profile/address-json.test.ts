import { describe, expect, it } from "vitest";
import {
  mergeAddressJson,
  parseAddressJson,
  readOpportunityPreferences,
} from "./address-json";

describe("address-json preferences", () => {
  it("returns empty defaults for missing json", () => {
    const prefs = readOpportunityPreferences(null);
    expect(prefs.preferredState).toBeNull();
    expect(prefs.preferredPlatforms).toEqual([]);
    expect(prefs.matchingNotifications).toBe(true);
    expect(prefs.minRewardMinor).toBe(0);
  });

  it("reads namespaced opportunity preferences without inventing locations", () => {
    const prefs = readOpportunityPreferences({
      state: "Lagos",
      city: "Ikeja",
      opportunity: {
        remotePreferred: true,
        preferredPlatforms: ["TikTok", "Instagram"],
        minRewardMinor: 5000,
      },
    });
    expect(prefs.preferredState).toBe("Lagos");
    expect(prefs.preferredCity).toBe("Ikeja");
    expect(prefs.remotePreferred).toBe(true);
    expect(prefs.preferredPlatforms).toEqual(["TikTok", "Instagram"]);
    expect(prefs.minRewardMinor).toBe(5000);
  });

  it("merges without dropping existing address fields", () => {
    const next = mergeAddressJson(
      { state: "Enugu", city: "Nsukka", country: "NG" },
      { opportunity: { matchingNotifications: false } },
    );
    expect(parseAddressJson(next).state).toBe("Enugu");
    expect(next.opportunity?.matchingNotifications).toBe(false);
  });
});
