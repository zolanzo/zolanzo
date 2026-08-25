import { afterEach, describe, expect, it } from "vitest";
import { APP_CONFIG } from "@/config/app";
import {
  EMAIL_SENDER_DISPLAY_NAME,
  EMAIL_SENDER_FROM,
  EMAIL_SENDER_MAILBOX,
  RESEND_SANDBOX_MAILBOX,
  canUseLiveSenderIdentity,
  formatZolanzoFrom,
  getTransactionalEmailSender,
  senderFromConfiguredValue,
} from "@/lib/email/sender";

describe("transactional email sender identity", () => {
  afterEach(() => {
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("uses the official ZOLANZO info mailbox when env is unset", () => {
    const sender = getTransactionalEmailSender({ NODE_ENV: "development" });
    expect(sender.displayName).toBe("ZOLANZO");
    expect(sender.mailbox).toBe("info@zolanzo.com");
    expect(sender.from).toBe("ZOLANZO <info@zolanzo.com>");
    expect(sender.from).toBe(EMAIL_SENDER_FROM);
    expect(sender.identityMode).toBe("official");
    expect(sender.replyTo).toBe(APP_CONFIG.supportEmail);
    expect(sender.replyTo).toBe("support@zolanzo.com");
    expect(sender.from.toLowerCase()).not.toContain("noreply@");
    expect(sender.from.toLowerCase()).not.toContain("onboarding@resend.dev");
    expect(sender.from.toLowerCase()).not.toContain("supabase");
  });

  it("coerces leftover noreply and generic display names to the official identity", () => {
    expect(senderFromConfiguredValue("noreply@zolanzo.com")?.from).toBe(EMAIL_SENDER_FROM);
    expect(senderFromConfiguredValue("info <hello@zolanzo.com>")?.from).toBe(EMAIL_SENDER_FROM);
    expect(senderFromConfiguredValue("noreply <mail@zolanzo.com>")?.from).toBe(
      EMAIL_SENDER_FROM,
    );
    expect(senderFromConfiguredValue("Supabase Auth <auth@zolanzo.com>")?.from).toBe(
      EMAIL_SENDER_FROM,
    );
    expect(senderFromConfiguredValue("Resend <onboarding@zolanzo.com>")?.mailbox).toBe(
      EMAIL_SENDER_MAILBOX,
    );
  });

  it("keeps the official identity when env repeats info@zolanzo.com", () => {
    const sender = getTransactionalEmailSender({
      NODE_ENV: "production",
      RESEND_FROM_EMAIL: "Zolanzo <info@zolanzo.com>",
    });
    expect(sender.from).toBe(`${EMAIL_SENDER_DISPLAY_NAME} <${EMAIL_SENDER_MAILBOX}>`);
    expect(canUseLiveSenderIdentity(sender, { NODE_ENV: "production" })).toBe(true);
  });

  it("ignores leftover updates@ / noreply@ env values for live From", () => {
    const sender = getTransactionalEmailSender({
      NODE_ENV: "production",
      RESEND_FROM_EMAIL: "updates@zolanzo.com",
    });
    expect(sender.from).toBe(EMAIL_SENDER_FROM);
  });

  it("refuses Resend sandbox as a production identity", () => {
    const sender = getTransactionalEmailSender({
      NODE_ENV: "production",
      RESEND_FROM_EMAIL: RESEND_SANDBOX_MAILBOX,
    });
    expect(sender.identityMode).toBe("resend_sandbox");
    expect(sender.from).toBe(formatZolanzoFrom(RESEND_SANDBOX_MAILBOX));
    expect(canUseLiveSenderIdentity(sender, { NODE_ENV: "production" })).toBe(false);
    expect(canUseLiveSenderIdentity(sender, { NODE_ENV: "development" })).toBe(true);
  });
});
