import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function homepageFooter(): string {
  return read("components/home/home-footer.tsx");
}

describe("homepage footer is compact and non-repetitive", () => {
  it("keeps WhatsApp and FAQ content off the homepage body and footer help", () => {
    const page = read("app/page.tsx");
    const footer = homepageFooter();
    expect(page).not.toContain("WhatsAppSupportLink");
    expect(page).not.toContain("HomeFaqAccordion");
    expect(page).not.toContain("Frequently Asked Questions");
    expect(page).not.toContain("Who can join ZOLANZO?");
    expect(page).not.toContain("Questions about ZOLANZO?");
    expect(page).not.toContain("Visit our FAQ");
    expect(footer).not.toContain("WhatsAppSupportLink");
    expect(footer).not.toContain("Admin WhatsApp");
    expect(footer).not.toContain("704 555 9401");
    expect(footer).not.toContain("+234");
    expect(footer).not.toContain("support@zolanzo.com");
    expect(footer).not.toContain("info@zolnzo.com");
  });

  it("keeps help, account, and legal links without duplicating header navigation", () => {
    const footer = homepageFooter();
    expect(footer).not.toContain("Find Work");
    expect(footer).not.toContain("Hire Talent");
    expect(footer).not.toContain("How It Works");
    expect(footer).toContain("FAQ");
    expect(footer).toContain("Support");
    expect(footer).toContain("Contact");
    expect(footer).toContain("Terms");
    expect(footer).toContain("Privacy");
    expect(footer).toContain("Careers");
    expect(footer).toContain("Log In");
    expect(footer).toContain("Sign Up");
    expect(footer).not.toContain("Marketplace");
    expect(footer).not.toContain("Earn Dashboard");
    expect(footer).not.toContain("Hire Dashboard");
    expect(footer).not.toContain("Reset PIN");
    expect(footer).not.toContain("Verify Email");
    expect(footer).not.toContain("Post a Task");
    expect(footer).not.toContain("Help Center");
    expect(footer).not.toContain("/wallet");
    expect(footer).not.toContain("/earner/dashboard");
    expect(footer).not.toContain("/hirer/dashboard");
    expect(footer.match(/href="\/support"/g)?.length).toBe(1);
    expect(footer.match(/href="\/faq"/g)?.length).toBe(1);
    expect(footer.match(/href="\/tasks"/g)?.length ?? 0).toBe(0);
    expect(footer.match(/href="\/signup"/g)?.length).toBe(1);
  });

  it("keeps copyright and a single Stankings link in the bottom bar", () => {
    const footer = homepageFooter();
    expect(footer).toContain("© 2026 ZOLANZO LTD. All rights reserved.");
    expect(footer).toContain("A Stankings Company");
    expect(footer).toContain("https://stankings.com/");
    expect(footer).not.toContain("Admin WhatsApp:");
  });
});

describe("shared chrome does not restyle WhatsApp as Admin WhatsApp", () => {
  it("keeps WhatsApp Support off the public header while labeling remaining contacts", () => {
    expect(read("components/navigation/navbar.tsx")).not.toContain("WhatsAppSupportLink");
    expect(read("components/home/home-footer.tsx")).not.toContain("WhatsAppSupportLink");
    expect(read("components/navigation/navbar.tsx")).not.toContain(
      "WhatsApp {APP_CONFIG.supportWhatsApp.display}",
    );
    expect(read("components/auth/auth-layout.tsx")).toContain("WhatsAppSupportLink");
    expect(read("components/layout/auth-layout.tsx")).toContain("WhatsAppSupportLink");
    expect(read("components/shell/profile-dropdown.tsx")).toContain(
      "WhatsApp Support",
    );
    expect(read("components/support/whatsapp-support-link.tsx")).toContain(
      'label ?? "WhatsApp Support"',
    );
  });
});
