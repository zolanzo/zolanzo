import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APP_CONFIG } from "@/config/app";
import { getContactInboxTemplate, getContactInboxText } from "@/lib/email/templates";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("contact inbox email", () => {
  it("addresses the official mailbox and keeps reply-to as the visitor", () => {
    expect(APP_CONFIG.supportEmail).toBe("info@zolanzo.com");
    const sender = read("lib/contact/send-message.ts");
    expect(sender).toContain("APP_CONFIG.supportEmail");
    expect(sender).toContain("replyTo: input.email");
    expect(sender).not.toContain("support@zolanzo.com");
    expect(sender).not.toContain("info@zolnzo.com");
  });

  it("renders a concise staff-facing message", () => {
    const html = getContactInboxTemplate({
      name: "Ada",
      email: "ada@example.com",
      subjectLabel: "Account & Login",
      message: "I cannot sign in.",
    });
    const text = getContactInboxText({
      name: "Ada",
      email: "ada@example.com",
      subjectLabel: "Account & Login",
      message: "I cannot sign in.",
    });
    expect(html).toContain("Account &amp; Login");
    expect(html).toContain("ada@example.com");
    expect(html).not.toContain("support@zolanzo.com");
    expect(text).toContain("From: Ada");
    expect(text).toContain("I cannot sign in.");
  });
});

describe("contact page form", () => {
  it("keeps the existing channels and adds the form fields", () => {
    const page = read("app/contact/page.tsx");
    const form = read("components/support/contact-form.tsx");
    expect(page).toContain("ContactForm");
    expect(page).toContain("ContactChannels");
    expect(page).toContain("Visit FAQ");
    expect(page).not.toContain("support@zolanzo.com");
    expect(form).toContain("Send Message");
    expect(form).toContain("How can we help?");
    expect(form).toContain("Full Name");
    expect(form).toContain("Email Address");
    expect(form).not.toContain("data-answer");
    expect(form).not.toContain("support@zolanzo.com");
  });
});
