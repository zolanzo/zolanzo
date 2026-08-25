import { APP_CONFIG } from "@/config/app";
import { isValidEmail } from "@/lib/auth/email";

/** Visible From display name for every ZOLANZO transactional email. */
export const EMAIL_SENDER_DISPLAY_NAME = "Zolanzo";

/** Official mailbox for every ZOLANZO transactional email. */
export const EMAIL_SENDER_MAILBOX = "info@zolanzo.com";

/** Official From header. Users must see this, not a provider or local-part name. */
export const EMAIL_SENDER_FROM = `${EMAIL_SENDER_DISPLAY_NAME} <${EMAIL_SENDER_MAILBOX}>`;

/**
 * Resend's only sendable mailbox without a verified domain.
 * Never treat this as production branding. Only used when explicitly configured.
 */
export const RESEND_SANDBOX_MAILBOX = "onboarding@resend.dev";

export type EmailSenderIdentityMode = "official" | "resend_sandbox";

export type TransactionalEmailSender = {
  from: string;
  replyTo: string;
  mailbox: string;
  displayName: typeof EMAIL_SENDER_DISPLAY_NAME;
  identityMode: EmailSenderIdentityMode;
};

type SenderEnv = {
  RESEND_FROM_EMAIL?: string;
  NODE_ENV?: string;
};

function extractMailbox(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const angled = trimmed.match(/<([^>]+)>/);
  const candidate = (angled?.[1] ?? trimmed).trim().toLowerCase();
  if (!isValidEmail(candidate)) return null;
  return candidate;
}

export function formatZolanzoFrom(mailbox: string): string {
  return `${EMAIL_SENDER_DISPLAY_NAME} <${mailbox}>`;
}

export function isResendSandboxMailbox(mailbox: string): boolean {
  return mailbox.trim().toLowerCase() === RESEND_SANDBOX_MAILBOX;
}

export function officialTransactionalSender(replyTo: string): TransactionalEmailSender {
  return {
    from: EMAIL_SENDER_FROM,
    replyTo,
    mailbox: EMAIL_SENDER_MAILBOX,
    displayName: EMAIL_SENDER_DISPLAY_NAME,
    identityMode: "official",
  };
}

/**
 * Parse a configured From value.
 * Display name is always Zolanzo — never the local-part (noreply, info, …)
 * and never a provider name.
 */
export function senderFromConfiguredValue(
  raw: string | undefined | null,
): Omit<TransactionalEmailSender, "replyTo"> | null {
  if (!raw?.trim()) return null;
  const mailbox = extractMailbox(raw);
  if (!mailbox) return null;
  if (isResendSandboxMailbox(mailbox)) {
    return {
      from: formatZolanzoFrom(mailbox),
      mailbox,
      displayName: EMAIL_SENDER_DISPLAY_NAME,
      identityMode: "resend_sandbox",
    };
  }
  return {
    from: EMAIL_SENDER_FROM,
    mailbox: EMAIL_SENDER_MAILBOX,
    displayName: EMAIL_SENDER_DISPLAY_NAME,
    identityMode: "official",
  };
}

export function getTransactionalReplyTo(): string {
  return APP_CONFIG.supportEmail;
}

/**
 * Canonical sender for every ZOLANZO transactional Resend send
 * (verification OTP, resend, PIN reset, welcome, security, notification hub).
 *
 * Live identity is always Zolanzo <info@zolanzo.com>.
 * RESEND_FROM_EMAIL may repeat that mailbox; leftover noreply/info/provider
 * names are ignored. Sandbox is only used when explicitly set.
 */
export function getTransactionalEmailSender(
  env: SenderEnv = process.env,
): TransactionalEmailSender {
  const replyTo = getTransactionalReplyTo();
  const configured = senderFromConfiguredValue(env.RESEND_FROM_EMAIL);
  if (configured?.identityMode === "resend_sandbox") {
    return { ...configured, replyTo };
  }
  return officialTransactionalSender(replyTo);
}

/**
 * Production live mail must use the official ZOLANZO mailbox, not Resend sandbox.
 * Sandbox is allowed in non-production so Resend can still deliver tests.
 */
export function canUseLiveSenderIdentity(
  sender: TransactionalEmailSender,
  env: SenderEnv = process.env,
): boolean {
  if (sender.identityMode === "official") return true;
  return env.NODE_ENV !== "production";
}
