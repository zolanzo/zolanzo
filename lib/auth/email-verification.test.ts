import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "@/lib/otp/generator";
import {
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_USER_MESSAGES,
  messageForOtpFailure,
} from "@/lib/auth/email-otp-constants";
import {
  EMAIL_BRAND_TAGLINE,
  EMAIL_FOOTER_TEXT,
  getBrandedAuthMessageTemplate,
  getEmailOtpTemplate,
  getEmailOtpText,
  getPinResetTemplate,
  getPinResetText,
} from "@/lib/email/templates";

describe("email normalization", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ada@Zolanzo.COM ")).toBe("ada@zolanzo.com");
  });

  it("rejects obviously invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b.co")).toBe(true);
  });
});

describe("otp generator", () => {
  it("creates a 6-digit code", () => {
    const code = generateOtpCode(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashes and verifies codes, ignoring extra formatting", () => {
    const hash = hashOtpCode("866015");
    expect(verifyOtpCode("866015", hash)).toBe(true);
    expect(verifyOtpCode("866-015", hash)).toBe(true);
    expect(verifyOtpCode("000000", hash)).toBe(false);
  });
});

describe("otp user messages", () => {
  it("maps failure reasons without leaking internals", () => {
    expect(messageForOtpFailure("expired")).toBe(EMAIL_OTP_USER_MESSAGES.expired);
    expect(messageForOtpFailure("invalid")).toBe(EMAIL_OTP_USER_MESSAGES.invalid);
    expect(messageForOtpFailure("already_used")).toBe(EMAIL_OTP_USER_MESSAGES.alreadyUsed);
    expect(messageForOtpFailure("already_verified")).toBe(EMAIL_OTP_USER_MESSAGES.alreadyVerified);
    expect(messageForOtpFailure("no_active")).toBe(EMAIL_OTP_USER_MESSAGES.noActive);
    expect(messageForOtpFailure("too_many")).toBe(EMAIL_OTP_USER_MESSAGES.tooManyAttempts);
    expect(messageForOtpFailure("need_new_code")).toBe(EMAIL_OTP_USER_MESSAGES.needNewCode);
    expect(EMAIL_OTP_USER_MESSAGES.noActive).toBe("No verification request found for this email.");
    expect(EMAIL_OTP_USER_MESSAGES.expired).toContain("Please request a new code");
    expect(EMAIL_OTP_USER_MESSAGES.tooManyAttempts).toContain("Too many attempts");
    expect(JSON.stringify(EMAIL_OTP_USER_MESSAGES)).not.toMatch(
      /No active verification code found for this email/i,
    );
    expect(EMAIL_OTP_PURPOSE.emailVerification).toBe("email_verification");
  });
});

describe("verification email template", () => {
  it("uses the light-mode branded template and absolute logo", () => {
    const html = getEmailOtpTemplate("866015", "Ada Okafor");
    const text = getEmailOtpText("866015", "Ada Okafor");
    expect(html).toContain("#F8FAFC");
    expect(html).toContain("#FFFFFF");
    expect(html).toContain("https://zolanzo.com/brand/light-theme-logo.png");
    expect(html).toContain('alt="ZOLANZO"');
    expect(html).toContain(EMAIL_BRAND_TAGLINE);
    expect(html).toContain("Verify Your Email Address");
    expect(html).toContain(
      "Hello Ada, use the 6-digit verification code below to complete your registration on ZOLANZO.",
    );
    expect(html).toContain("866015");
    expect(html).toContain("This code will expire in 10 minutes");
    expect(html).toContain("© 2026 ZOLANZO LTD");
    expect(html).toContain("A Stankings Company");
    expect(html).toContain("stankings.com");
    expect(html).toContain("https://stankings.com");
    expect(html).toContain('role="presentation"');
    expect(html).not.toContain("letter-spacing:8px");
    expect(html).not.toContain("#050608");
    expect(html).not.toContain("#04090B");
    expect(html).not.toContain('src="/brand/');
    expect(html.toLowerCase()).not.toContain("supabase");
    expect(html.toLowerCase()).not.toContain("resend");
    expect(html.toLowerCase()).not.toContain("localhost");
    const preview = html.match(/display:none[\s\S]*?<\/div>/)?.[0] ?? "";
    expect(preview).toContain("Verify your ZOLANZO email address");
    expect(preview).not.toContain("866015");
    expect(html).toContain("<title>ZOLANZO Verification Code</title>");
    expect(text).toContain("ZOLANZO");
    expect(text).toContain(EMAIL_BRAND_TAGLINE);
    expect(text).toContain("Verify Your Email Address");
    expect(text).toContain("866015");
    expect(text).toContain(EMAIL_FOOTER_TEXT);
  });

  it("escapes recipient names", () => {
    const html = getEmailOtpTemplate("123456", "<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps PIN reset on the same light template with a different action", () => {
    const html = getPinResetTemplate("654321", "Ada");
    const text = getPinResetText("654321", "Ada");
    expect(html).toContain("#F8FAFC");
    expect(html).toContain("https://zolanzo.com/brand/light-theme-logo.png");
    expect(html).toContain("654321");
    expect(html).toContain("Reset your security PIN");
    expect(html).toContain("PIN Recovery");
    expect(html).toContain("stankings.com");
    expect(html).not.toContain("Verify your email address");
    expect(html).not.toContain("Verify Your Email Address");
    expect(text).toContain("654321");
    expect(text).toContain(EMAIL_FOOTER_TEXT);
  });

  it("renders link-based auth mail in the same shell without an OTP block", () => {
    const html = getBrandedAuthMessageTemplate({
      title: "Welcome to ZOLANZO",
      kicker: "Welcome",
      heading: "Your account is ready",
      recipientName: "Ada",
      body: "Welcome to ZOLANZO. Your account is ready to use.",
      actionLabel: "Open ZOLANZO",
      actionUrl: "https://zolanzo.com/login",
    });
    expect(html).toContain("https://zolanzo.com/brand/light-theme-logo.png");
    expect(html).toContain("Your account is ready");
    expect(html).toContain("Open ZOLANZO");
    expect(html).toContain("https://zolanzo.com/login");
    expect(html).toContain("stankings.com");
    expect(html).not.toContain("letter-spacing:8px");
  });
});

describe("auth mailer leakage", () => {
  it("does not call GoTrue signup, password reset, or confirm resend", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const leftover = readFileSync(
      join(process.cwd(), "features/authentication/services/auth-service.ts"),
      "utf8",
    );
    const pinAuth = readFileSync(join(process.cwd(), "lib/auth/service.ts"), "utf8");
    const resend = readFileSync(join(process.cwd(), "lib/email/resend.ts"), "utf8");
    expect(leftover).not.toContain("resetPasswordForEmail");
    expect(leftover).not.toContain("auth.signUp");
    expect(leftover).not.toContain("auth.resend");
    expect(pinAuth).not.toContain("auth.signUp");
    expect(pinAuth).toContain("admin.createUser");
    expect(pinAuth).toContain("email_confirm: false");
    expect(pinAuth).not.toContain("No active verification code found for this email.");
    expect(resend).not.toMatch(/console\.warn\(`\[DEV MODE\] Email OTP to \$\{email\}: \$\{code\}`\)/);
    expect(resend).not.toContain("noreply@zolanzo.com");
    expect(resend).not.toContain("onboarding@resend.dev");
    expect(resend).toContain("getEmailOtpText");
    expect(resend).toContain("getPinResetText");
    expect(resend).toContain("getSecurityAlertText");
    expect(resend).toContain("text: params.text");
    expect(pinAuth).not.toContain("noreply@zolanzo.com");
  });
});
