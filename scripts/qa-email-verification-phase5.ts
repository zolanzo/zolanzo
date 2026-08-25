/**
 * Phase 5 — end-to-end verification synchronization.
 * Asserts the emailed code is the code the verify page/API accepts.
 * Does not print verification codes.
 */
import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  EMAIL_OTP_MAX_ATTEMPTS,
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_USER_MESSAGES,
} from "../lib/auth/email-otp-constants";
import { EMAIL_SENDER_FROM } from "../lib/email/sender";
import { EMAIL_BRAND_TAGLINE, EMAIL_FOOTER_TEXT } from "../lib/email/templates";
import {
  getDevEmailDebugPath,
  getDevEmailLogPath,
} from "../lib/email/dev-otp-capture";
import { APP_CONFIG } from "../config/app";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const BASE = process.env.QA_AUTH_BASE_URL || "http://127.0.0.1:3000";
const LEGACY_NO_ACTIVE = /No active verification code found for this email/i;

type CapturedEmail = {
  email: string;
  purpose: string;
  kind: string;
  code: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

type ApiJson = {
  error?: string;
  success?: boolean;
  data?: Record<string, unknown>;
  message?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiJson;
  return { status: res.status, json };
}

function countOutboundFor(email: string, kind = "email_otp"): number {
  if (!existsSync(getDevEmailLogPath())) return 0;
  return readFileSync(getDevEmailLogPath(), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { email?: string; kind?: string })
    .filter((row) => row.email === email && row.kind === kind).length;
}

async function waitForCapturedEmail(
  email: string,
  expectedCount = 1,
  timeoutMs = 12_000,
): Promise<CapturedEmail> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (countOutboundFor(email) >= expectedCount && existsSync(getDevEmailDebugPath())) {
        const parsed = JSON.parse(readFileSync(getDevEmailDebugPath(), "utf8")) as CapturedEmail;
        if (parsed.email === email && /^\d{6}$/.test(parsed.code || "")) {
          return parsed;
        }
      }
    } catch {
      // File may be mid-write.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for captured verification email for ${email}.`);
}

function assertGeneratedEmail(captured: CapturedEmail, email: string) {
  if (captured.email !== email) {
    throw new Error("Captured email recipient does not match the signup address.");
  }
  if (captured.from !== EMAIL_SENDER_FROM) {
    throw new Error(`Sender mismatch: ${captured.from}`);
  }
  if (captured.replyTo !== APP_CONFIG.supportEmail) {
    throw new Error(`Reply-To mismatch: ${captured.replyTo}`);
  }
  if (!/^\d{6}$/.test(captured.code)) {
    throw new Error("Generated verification email did not include a 6-digit code.");
  }
  if (!captured.subject.includes("is your ZOLANZO verification code")) {
    throw new Error("Verification subject is missing the ZOLANZO code line.");
  }
  if (!captured.subject.includes(captured.code)) {
    throw new Error("Verification subject does not contain the generated code.");
  }
  for (const part of [captured.html, captured.text]) {
    if (!part.includes(captured.code)) {
      throw new Error("Generated verification email body is missing the 6-digit code.");
    }
    if (!part.includes("Verify Your Email Address")) {
      throw new Error("Generated verification email is missing the approved heading.");
    }
    if (!part.includes(EMAIL_BRAND_TAGLINE)) {
      throw new Error("Generated verification email is missing the ZOLANZO tagline.");
    }
    if (!part.includes(EMAIL_FOOTER_TEXT.replace(" • stankings.com", "")) && !part.includes("stankings.com")) {
      throw new Error("Generated verification email is missing the official footer.");
    }
  }
  if (!captured.html.includes("https://zolanzo.com/brand/light-theme-logo.png")) {
    throw new Error("Generated verification email is missing the official light-mode logo.");
  }
  const lowered = `${captured.html}\n${captured.text}`.toLowerCase();
  if (lowered.includes("supabase") || lowered.includes("localhost") || captured.html.includes("#050608")) {
    throw new Error("Generated verification email contains leftover provider or dark-mode branding.");
  }
}

function assertError(actual: string | undefined, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}" got "${actual ?? ""}"`);
  }
  if (LEGACY_NO_ACTIVE.test(actual ?? "")) {
    throw new Error(`${label}: legacy no-active copy leaked.`);
  }
}

async function signup(email: string, fullName: string, role: "worker" | "employer", pin: string) {
  const response = await post("/api/auth/signup", { role, fullName, email, pin });
  if (response.status >= 400) {
    throw new Error(`signup failed for ${email}: ${response.json.error}`);
  }
  if (
    response.json.data &&
    ("code" in response.json.data || "otp" in response.json.data || "mockOtp" in response.json.data)
  ) {
    throw new Error("Signup response leaked a verification code.");
  }
  return response;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Missing Supabase admin credentials");
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const stamp = Date.now();
  const pin = "212523";
  const results: string[] = [];
  const admin = adminClient();

  const missing = await post("/api/auth/verify-email", {
    email: `nobody.${stamp}@zolanzo.test`,
    code: "123456",
  });
  assertError(missing.json.error, EMAIL_OTP_USER_MESSAGES.noActive, "no-request");
  results.push("no-verification-request: ok");

  const happyEmail = `qa.phase5.happy.${stamp}@zolanzo.test`;
  const mixedCase = `QA.Phase5.Happy.${stamp}@Zolanzo.TEST`;
  const signupHappy = await signup(happyEmail, "Phase5 Happy", "worker", pin);
  const captured = await waitForCapturedEmail(happyEmail, 1);
  assertGeneratedEmail(captured, happyEmail);
  if (countOutboundFor(happyEmail) !== 1) {
    throw new Error(`Expected exactly one verification email at signup, got ${countOutboundFor(happyEmail)}.`);
  }
  results.push("1-signup: ok");
  results.push("2-capture-email: ok");
  results.push("3-one-verification-email: ok");
  results.push("4-sender-identity: ok");
  results.push("5-branding: ok");
  results.push("6-six-digit-code: ok");

  const invalid = await post("/api/auth/verify-email", { email: happyEmail, code: "000000" });
  assertError(invalid.json.error, EMAIL_OTP_USER_MESSAGES.invalid, "A-invalid");
  results.push("A-invalid-code: ok");

  const [firstRapid, secondRapid] = await Promise.all([
    post("/api/auth/verify-email", { email: mixedCase, code: captured.code }),
    post("/api/auth/verify-email", { email: happyEmail, code: captured.code }),
  ]);
  const rapidStatuses = [firstRapid, secondRapid];
  const rapidSuccesses = rapidStatuses.filter((row) => row.status < 400);
  const rapidFailures = rapidStatuses.filter((row) => row.status >= 400);
  if (rapidSuccesses.length !== 1) {
    throw new Error(`K-rapid: expected exactly one success, got ${rapidSuccesses.length}`);
  }
  if (
    rapidFailures.length !== 1 ||
    ![EMAIL_OTP_USER_MESSAGES.alreadyVerified, EMAIL_OTP_USER_MESSAGES.alreadyUsed].includes(
      rapidFailures[0]?.json.error as typeof EMAIL_OTP_USER_MESSAGES.alreadyVerified,
    )
  ) {
    throw new Error(`K-rapid: unexpected second result ${rapidFailures[0]?.json.error}`);
  }
  results.push("8-exact-emailed-code: ok");
  results.push("9-verify-success: ok");
  results.push("I-case-normalization: ok");
  results.push("K-rapid-submissions: ok");

  const userId = String(signupHappy.json.data?.userId ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (admin.from("profiles") as any)
    .select("email_verified, email")
    .eq("email", happyEmail)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile?.email_verified) {
    throw new Error("Profile email_verified did not update after the emailed code was accepted.");
  }
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError) throw new Error(authError.message);
  if (!authUser.user?.email_confirmed_at) {
    throw new Error("Auth email_confirmed_at did not update after verification.");
  }
  results.push("10-account-status: ok");

  const alreadyVerified = await post("/api/auth/verify-email", {
    email: happyEmail,
    code: captured.code,
  });
  assertError(
    alreadyVerified.json.error,
    EMAIL_OTP_USER_MESSAGES.alreadyVerified,
    "already-verified",
  );
  results.push("already-verified: ok");

  const login = await post("/api/auth/login", { email: happyEmail, pin });
  if (login.status >= 400) throw new Error(`login failed: ${login.json.error}`);
  if (login.json.data?.requiresEmailVerification) {
    throw new Error("Verified user still requires email verification.");
  }
  if (login.json.data?.redirectUrl !== "/onboarding") {
    throw new Error(`Unexpected post-verify login redirect: ${JSON.stringify(login.json.data)}`);
  }
  results.push("11-routed-after-login: ok");

  const resendEmail = `qa.phase5.resend.${stamp}@zolanzo.test`;
  await signup(resendEmail, "Phase5 Resend", "employer", pin);
  const firstResendCapture = await waitForCapturedEmail(resendEmail, 1);
  const firstCode = firstResendCapture.code;
  const resend1 = await post("/api/auth/resend-verification", { email: resendEmail });
  if (resend1.status >= 400) throw new Error(`resend failed: ${resend1.json.error}`);
  const afterFirstResend = await waitForCapturedEmail(resendEmail, 2);
  const resend2 = await post("/api/auth/resend-verification", { email: resendEmail });
  if (resend2.status >= 400) throw new Error(`second resend failed: ${resend2.json.error}`);
  const newestCapture = await waitForCapturedEmail(resendEmail, 3);
  if (countOutboundFor(resendEmail) !== 3) {
    throw new Error(`Expected signup + 2 resends to produce 3 verification emails, got ${countOutboundFor(resendEmail)}.`);
  }
  results.push("D-resend: ok");
  results.push("J-multiple-resend: ok");

  if (firstCode !== newestCapture.code) {
    const oldAfterResend = await post("/api/auth/verify-email", {
      email: resendEmail,
      code: firstCode,
    });
    assertError(oldAfterResend.json.error, EMAIL_OTP_USER_MESSAGES.alreadyUsed, "E-old-after-resend");
    results.push("C-already-used: ok");
    results.push("E-previous-code-after-resend: ok");
  } else {
    results.push("C-already-used: skipped-same-value");
    results.push("E-previous-code-after-resend: skipped-same-value");
  }
  if (afterFirstResend.code !== newestCapture.code) {
    const middle = await post("/api/auth/verify-email", {
      email: resendEmail,
      code: afterFirstResend.code,
    });
    assertError(middle.json.error, EMAIL_OTP_USER_MESSAGES.alreadyUsed, "middle-resend-code");
  }

  const newest = await post("/api/auth/verify-email", {
    email: `QA.Phase5.Resend.${stamp}@Zolanzo.TEST`,
    code: newestCapture.code,
  });
  if (newest.status >= 400) throw new Error(`newest code after resend failed: ${newest.json.error}`);
  results.push("F-new-code-after-resend: ok");

  const expiredEmail = `qa.phase5.expired.${stamp}@zolanzo.test`;
  await signup(expiredEmail, "Phase5 Expired", "worker", pin);
  const expiredCapture = await waitForCapturedEmail(expiredEmail, 1);
  const past = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const { error: expireError } = await admin
    .from("email_verifications")
    .update({ expires_at: past })
    .eq("email", expiredEmail)
    .eq("purpose", EMAIL_OTP_PURPOSE.emailVerification)
    .is("consumed_at", null);
  if (expireError) throw new Error(expireError.message);
  const expired = await post("/api/auth/verify-email", {
    email: expiredEmail,
    code: expiredCapture.code,
  });
  assertError(expired.json.error, EMAIL_OTP_USER_MESSAGES.expired, "B-expired");
  results.push("B-expired-code: ok");

  const lockoutEmail = `qa.phase5.lockout.${stamp}@zolanzo.test`;
  await signup(lockoutEmail, "Phase5 Lockout", "worker", pin);
  await waitForCapturedEmail(lockoutEmail, 1);
  for (let i = 0; i < EMAIL_OTP_MAX_ATTEMPTS; i += 1) {
    const wrong = await post("/api/auth/verify-email", {
      email: lockoutEmail,
      code: "000000",
    });
    assertError(wrong.json.error, EMAIL_OTP_USER_MESSAGES.invalid, `lockout-invalid-${i + 1}`);
  }
  const tooMany = await post("/api/auth/verify-email", { email: lockoutEmail, code: "111111" });
  assertError(tooMany.json.error, EMAIL_OTP_USER_MESSAGES.tooManyAttempts, "too-many");
  results.push("too-many-attempts: ok");
  const needNew = await post("/api/auth/verify-email", { email: lockoutEmail, code: "222222" });
  assertError(needNew.json.error, EMAIL_OTP_USER_MESSAGES.needNewCode, "need-new-code");
  results.push("please-request-a-new-code: ok");

  console.log(
    JSON.stringify(
      {
        ok: true,
        results,
        emails: { happyEmail, resendEmail, expiredEmail, lockoutEmail },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
