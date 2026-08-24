import { describe, expect, it } from "vitest";
import { HOME_SOCIAL_PLATFORMS, HOME_SUCCESS_STORIES } from "@/components/home/home-content";
import { PREFERENCE_PLATFORMS } from "@/features/settings/constants";

describe("homepage social opportunities stay within existing platforms", () => {
  it("lists the current social platforms without invented work types", () => {
    expect(HOME_SOCIAL_PLATFORMS.map((platform) => platform.label)).toEqual([
      "Instagram",
      "TikTok",
      "Facebook",
      "X",
      "YouTube",
      "Telegram",
      "WhatsApp",
      "LinkedIn",
    ]);
  });

  it("uses labels already present in earner preference platforms", () => {
    const preferenceLabels = PREFERENCE_PLATFORMS.map((platform) => platform.label);
    for (const platform of HOME_SOCIAL_PLATFORMS) {
      expect(preferenceLabels).toContain(platform.label);
    }
  });
});

describe("homepage success stories stay a compact existing set", () => {
  it("keeps 4–6 existing testimonials", () => {
    expect(HOME_SUCCESS_STORIES.length).toBeGreaterThanOrEqual(4);
    expect(HOME_SUCCESS_STORIES.length).toBeLessThanOrEqual(6);
  });

  it("retains a mixed earner and hirer selection", () => {
    const names = HOME_SUCCESS_STORIES.map((story) => story.name);
    expect(names).toEqual([
      "Grace A.",
      "Samuel K.",
      "Amina H.",
      "Kofi M.",
      "Zainab B.",
      "Tariq S.",
    ]);
    expect(HOME_SUCCESS_STORIES.filter((story) => story.joined === "Verified Hirer")).toHaveLength(2);
    expect(new Set(HOME_SUCCESS_STORIES.map((story) => story.country)).size).toBeGreaterThanOrEqual(3);
  });
});
