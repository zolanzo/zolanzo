import { describe, expect, it } from "vitest";
import { APP_CONFIG } from "@/config/app";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/components/legal/privacy-sections";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/components/legal/terms-sections";

describe("legal documents", () => {
  it("uses the official info mailbox, not a second support inbox", () => {
    expect(APP_CONFIG.supportEmail).toBe("info@zolanzo.com");
    expect(JSON.stringify(TERMS_SECTIONS)).not.toContain("support@zolanzo.com");
    expect(JSON.stringify(PRIVACY_SECTIONS)).not.toContain("support@zolanzo.com");
  });

  it("publishes terms covering accounts, work, and money", () => {
    expect(TERMS_INTRO).toContain("ZOLANZO LTD");
    const titles = TERMS_SECTIONS.map((section) => section.title);
    expect(titles).toEqual(
      expect.arrayContaining(["The platform", "Accounts", "Earners", "Hirers", "Money on the platform"]),
    );
    expect(TERMS_SECTIONS.every((section) => section.paragraphs.length > 0)).toBe(true);
  });

  it("publishes privacy covering collection, use, and contact", () => {
    expect(PRIVACY_INTRO).toContain("ZOLANZO LTD");
    const titles = PRIVACY_SECTIONS.map((section) => section.title);
    expect(titles).toEqual(
      expect.arrayContaining(["Information we collect", "How we use it", "Your choices"]),
    );
  });
});
