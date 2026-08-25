import { appendFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const DEBUG_OTP_PATH = join(tmpdir(), "zolanzo-last-otp.json");
const DEBUG_EMAIL_PATH = join(tmpdir(), "zolanzo-last-email.json");
const DEBUG_EMAIL_LOG_PATH = join(tmpdir(), "zolanzo-outbound-emails.jsonl");

export type CapturedDevOutboundEmail = {
  email: string;
  purpose: string;
  kind: "email_otp" | "pin_reset";
  capturedAt: string;
  code: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

function allowDevCapture(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Local capture of the generated verification email.
 * Never writes in production. Used so the emailed code can be verified locally.
 */
export function captureDevOtp(email: string, code: string, purpose: string): void {
  if (!allowDevCapture()) return;
  writeFileSync(
    DEBUG_OTP_PATH,
    `${JSON.stringify({ email, purpose, capturedAt: new Date().toISOString(), code })}\n`,
    "utf8",
  );
}

export function captureDevOutboundEmail(payload: CapturedDevOutboundEmail): void {
  if (!allowDevCapture()) return;
  captureDevOtp(payload.email, payload.code, payload.purpose);
  writeFileSync(DEBUG_EMAIL_PATH, `${JSON.stringify(payload)}\n`, "utf8");
  appendFileSync(
    DEBUG_EMAIL_LOG_PATH,
    `${JSON.stringify({
      email: payload.email,
      from: payload.from,
      replyTo: payload.replyTo,
      kind: payload.kind,
      purpose: payload.purpose,
      capturedAt: payload.capturedAt,
    })}\n`,
    "utf8",
  );
}

export function getDevOtpDebugPath(): string {
  return DEBUG_OTP_PATH;
}

export function getDevEmailDebugPath(): string {
  return DEBUG_EMAIL_PATH;
}

export function getDevEmailLogPath(): string {
  return DEBUG_EMAIL_LOG_PATH;
}
