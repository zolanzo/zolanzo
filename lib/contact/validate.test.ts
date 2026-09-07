import { describe, expect, it } from "vitest";
import { CONTACT_SUBJECTS, isContactSubject } from "@/lib/contact/subjects";
import { isValidEmail } from "@/lib/auth/email";
import { validateContactFields } from "@/lib/contact/validate";

describe("contact subjects", () => {
  it("keeps a short useful set of ZOLANZO categories", () => {
    expect(CONTACT_SUBJECTS.map((item) => item.label)).toEqual([
      "General Enquiry",
      "Account & Login",
      "Find Work",
      "Hiring / Campaigns",
      "Payments & Wallet",
      "Technical Issue",
      "Report a Problem",
      "Other",
    ]);
    expect(isContactSubject("general")).toBe(true);
    expect(isContactSubject("spam")).toBe(false);
  });
});

describe("contact field validation", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "general",
    message: "I need help with my account.",
  };

  it("requires name, valid email, subject, and message", () => {
    expect(validateContactFields({ ...valid, name: " " }).ok).toBe(false);
    expect(validateContactFields({ ...valid, email: "not-an-email" }).ok).toBe(false);
    expect(validateContactFields({ ...valid, subject: "unknown" }).ok).toBe(false);
    expect(validateContactFields({ ...valid, message: "hi" }).ok).toBe(false);
    expect(isValidEmail("ada@example.com")).toBe(true);
    expect(validateContactFields(valid).ok).toBe(true);
  });

  it("rejects a filled honeypot", () => {
    const result = validateContactFields({ ...valid, website: "https://spam.test" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.honeypot).toBe(true);
  });
});
