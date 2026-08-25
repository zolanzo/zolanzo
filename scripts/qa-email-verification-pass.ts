import dotenv from "dotenv";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { EMAIL_OTP_PURPOSE, EMAIL_OTP_USER_MESSAGES } from "../lib/auth/email-otp-constants";
import { getDevOtpDebugPath } from "../lib/email/dev-otp-capture";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const BASE = process.env.QA_AUTH_BASE_URL || "http://127.0.0.1:3000";

function readCapturedCode(email: string, purpose?: string): string {
  const raw = readFileSync(getDevOtpDebugPath(), "utf8").trim();
  const parsed = JSON.parse(raw) as { email?: string; code?: string; purpose?: string };
  if (!parsed.code || parsed.email !== email) {
    throw new Error("Captured OTP does not match the expected email.");
  }
  if (purpose && parsed.purpose !== purpose) {
    throw new Error(`Captured OTP purpose mismatch: ${parsed.purpose}`);
  }
  return parsed.code;
}

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { error?: string; success?: boolean; data?: Record<string, unknown> };
  return { status: res.status, json };
}

async function main() {
  const stamp = Date.now();
  const pin = "212523";
  const results: string[] = [];
  const email = `qa.auth.${stamp}@zolanzo.test`;

  const signup = await post("/api/auth/signup", {
    role: "worker",
    fullName: "QA Auth Earner",
    email,
    pin,
  });
  if (signup.status >= 400) throw new Error(`signup failed: ${signup.json.error}`);
  if (signup.json.data && ("code" in signup.json.data || "otp" in signup.json.data || "mockOtp" in signup.json.data)) {
    throw new Error("Signup response leaked a verification code.");
  }
  results.push("A-signup: ok");

  const firstCode = readCapturedCode(email);
  if (!/^\d{6}$/.test(firstCode)) throw new Error("Signup did not capture a 6-digit code.");
  results.push("B-first-code: ok");

  const missing = await post("/api/auth/verify-email", {
    email: `nobody.${stamp}@zolanzo.test`,
    code: "123456",
  });
  if (missing.json.error !== EMAIL_OTP_USER_MESSAGES.noActive) {
    throw new Error(`unexpected missing-code error: ${missing.json.error}`);
  }
  if (/No active verification code found for this email/i.test(missing.json.error ?? "")) {
    throw new Error("Legacy no-active copy leaked.");
  }
  results.push("nonexistent-code: ok");

  const wrong = await post("/api/auth/verify-email", { email, code: "000000" });
  if (wrong.json.error !== EMAIL_OTP_USER_MESSAGES.invalid) {
    throw new Error(`unexpected wrong-code error: ${wrong.json.error}`);
  }
  results.push("C-wrong-code: ok");

  const secondWrong = await post("/api/auth/verify-email", { email, code: "111111" });
  if (secondWrong.json.error !== EMAIL_OTP_USER_MESSAGES.invalid) {
    throw new Error(`unexpected second wrong-code error: ${secondWrong.json.error}`);
  }
  results.push("J-multiple-attempts: ok");

  const mixedCaseEmail = `QA.Auth.${stamp}@Zolanzo.TEST`;
  const verify = await post("/api/auth/verify-email", { email: mixedCaseEmail, code: firstCode });
  if (verify.status >= 400) throw new Error(`verify failed: ${verify.json.error}`);
  results.push("D-correct-code: ok");
  results.push("I-case-variation: ok");

  const reuse = await post("/api/auth/verify-email", { email, code: firstCode });
  if (!reuse.json.error || !/already verified|already been used/i.test(reuse.json.error)) {
    throw new Error(`unexpected reuse error: ${reuse.json.error}`);
  }
  results.push("reuse: ok");

  const login = await post("/api/auth/login", { email, pin });
  if (login.status >= 400) throw new Error(`login failed: ${login.json.error}`);
  if (login.json.data?.requiresEmailVerification) {
    throw new Error("Verified user still requires email verification");
  }
  if (login.json.data?.redirectUrl !== "/onboarding") {
    throw new Error(`Unexpected redirect: ${JSON.stringify(login.json.data)}`);
  }
  results.push("K-login-after-verify: ok");

  const forgotUnknown = await post("/api/auth/forgot-pin", {
    email: `missing.${stamp}@zolanzo.test`,
  });
  if (forgotUnknown.status >= 400) {
    throw new Error(`unknown email forgot-pin should succeed: ${forgotUnknown.json.error}`);
  }
  results.push("forgot-pin-unknown-email: ok");

  const forgot = await post("/api/auth/forgot-pin", { email });
  if (forgot.status >= 400) throw new Error(`forgot-pin failed: ${forgot.json.error}`);
  const pinResetCode = readCapturedCode(email, EMAIL_OTP_PURPOSE.pinReset);
  if (!/^\d{6}$/.test(pinResetCode)) throw new Error("PIN reset did not capture a 6-digit code.");
  results.push("pin-reset-code-captured: ok");

  const pinWrong = await post("/api/auth/verify-email", {
    email,
    code: "000000",
    purpose: EMAIL_OTP_PURPOSE.pinReset,
  });
  if (pinWrong.json.error !== EMAIL_OTP_USER_MESSAGES.invalid) {
    throw new Error(`unexpected pin-reset wrong-code error: ${pinWrong.json.error}`);
  }
  results.push("pin-reset-wrong-code: ok");

  const pinVerify = await post("/api/auth/verify-email", {
    email,
    code: pinResetCode,
    purpose: EMAIL_OTP_PURPOSE.pinReset,
  });
  if (pinVerify.status >= 400) throw new Error(`pin-reset verify failed: ${pinVerify.json.error}`);
  results.push("pin-reset-verify: ok");

  const resetWithoutMatch = await post("/api/auth/reset-pin", {
    email: `other.${stamp}@zolanzo.test`,
    newPin: "654321",
  });
  if (resetWithoutMatch.status < 400) {
    throw new Error("reset-pin without a grant should fail");
  }
  results.push("reset-pin-without-grant: ok");

  const resetPin = await post("/api/auth/reset-pin", { email, newPin: "654321" });
  if (resetPin.status >= 400) throw new Error(`reset-pin failed: ${resetPin.json.error}`);
  results.push("reset-pin: ok");

  const oldPinLogin = await post("/api/auth/login", { email, pin });
  if (oldPinLogin.status < 400) {
    throw new Error("Old PIN still worked after reset");
  }
  results.push("old-pin-rejected: ok");

  const newPinLogin = await post("/api/auth/login", { email, pin: "654321" });
  if (newPinLogin.status >= 400) throw new Error(`new PIN login failed: ${newPinLogin.json.error}`);
  results.push("new-pin-login: ok");

  const resetAgain = await post("/api/auth/reset-pin", { email, newPin: "111111" });
  if (resetAgain.status < 400) {
    throw new Error("Second reset-pin without a new grant should fail");
  }
  results.push("reset-pin-grant-consumed: ok");

  const resendEmail = `qa.resend.${stamp}@zolanzo.test`;
  const signup2 = await post("/api/auth/signup", {
    role: "employer",
    fullName: "QA Auth Hirer",
    email: resendEmail,
    pin,
  });
  if (signup2.status >= 400) throw new Error(`hirer signup failed: ${signup2.json.error}`);
  const oldCode = readCapturedCode(resendEmail);
  const resend = await post("/api/auth/resend-verification", { email: resendEmail });
  if (resend.status >= 400) throw new Error(`resend failed: ${resend.json.error}`);
  const newCode = readCapturedCode(resendEmail);
  results.push(oldCode === newCode ? "F-resend: same-value-rare" : "F-resend: rotated");

  if (oldCode === newCode) {
    results.push("G-old-code-after-resend: skipped-same-value");
  } else {
    const oldAfterResend = await post("/api/auth/verify-email", { email: resendEmail, code: oldCode });
    if (oldAfterResend.json.error !== EMAIL_OTP_USER_MESSAGES.alreadyUsed) {
      throw new Error(`unexpected old-code error: ${oldAfterResend.json.error}`);
    }
    results.push("G-old-code-after-resend: ok");
  }

  const newest = await post("/api/auth/verify-email", { email: resendEmail, code: newCode });
  if (newest.status >= 400) throw new Error(`newest code failed: ${newest.json.error}`);
  results.push("H-new-code-after-resend: ok");

  const expiredEmail = `qa.expired.${stamp}@zolanzo.test`;
  const signup3 = await post("/api/auth/signup", {
    role: "worker",
    fullName: "QA Expired",
    email: expiredEmail,
    pin,
  });
  if (signup3.status >= 400) throw new Error(`expired signup failed: ${signup3.json.error}`);
  const expiredCode = readCapturedCode(expiredEmail);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Missing Supabase admin credentials");
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const past = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const { error: expireError } = await admin
    .from("email_verifications")
    .update({ expires_at: past })
    .eq("email", expiredEmail)
    .eq("purpose", EMAIL_OTP_PURPOSE.emailVerification)
    .is("consumed_at", null);
  if (expireError) throw new Error(expireError.message);

  const expired = await post("/api/auth/verify-email", { email: expiredEmail, code: expiredCode });
  if (expired.json.error !== EMAIL_OTP_USER_MESSAGES.expired) {
    throw new Error(`unexpected expired error: ${expired.json.error}`);
  }
  results.push("E-expired-code: ok");

  console.log(JSON.stringify({ ok: true, results, email, resendEmail }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
