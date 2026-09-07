import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_CONFIG } from "@/config/app";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("public contact channels", () => {
  it("exposes the official info mailbox once beside WhatsApp", () => {
    expect(APP_CONFIG.supportEmail).toBe("info@zolanzo.com");
    const channels = read("components/support/contact-channels.tsx");
    expect(channels).toContain("APP_CONFIG.supportEmail");
    expect(channels).toContain("WhatsAppSupportLink");
    expect(channels).not.toContain("support@zolanzo.com");
    expect(channels).not.toContain("Contact ZOLANZO");
  });

  it("does not stack a third contact CTA on legal, FAQ, or contact pages", () => {
    expect(read("app/terms/page.tsx")).toContain("ContactChannels");
    expect(read("app/privacy/page.tsx")).toContain("ContactChannels");
    expect(read("app/faq/page.tsx")).toContain("ContactChannels");
    expect(read("app/faq/page.tsx")).not.toContain("Contact ZOLANZO");
    expect(read("app/contact/page.tsx")).not.toContain("Contact ZOLANZO");
    expect(read("app/contact/page.tsx")).not.toContain("supportWhatsApp.display");
  });
});
