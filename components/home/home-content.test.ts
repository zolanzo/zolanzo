import { describe, expect, it } from "vitest";
import { HOME_SOCIAL_PLATFORMS } from "@/components/home/home-content";
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
