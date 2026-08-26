import { getEmailOtpTemplate, getEmailOtpText, getPinResetTemplate, getPinResetText, getSecurityAlertTemplate, getSecurityAlertText } from "./templates";
import { EMAIL_OTP_PURPOSE } from "@/lib/auth/email-otp-constants";
import { captureDevOutboundEmail } from "@/lib/email/dev-otp-capture";
import {
  canUseLiveSenderIdentity,
  getTransactionalEmailSender,
} from "@/lib/email/sender";

export function isLiveEmailRequired(
  env: { NODE_ENV?: string; ZOLANZO_ENV?: string } = process.env,
): boolean {
  return (
    env.NODE_ENV === "production" ||
    env.ZOLANZO_ENV === "production" ||
    env.ZOLANZO_ENV === "staging"
  );
}

async function postResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender = getTransactionalEmailSender();

  if (!apiKey) {
    if (isLiveEmailRequired()) {
      return { success: false };
    }
    return { success: true, id: `dev_${Date.now()}` };
  }

  if (!canUseLiveSenderIdentity(sender)) {
    console.error(
      "Production mail cannot use the Resend sandbox sender. Verify zolanzo.com in Resend and send as Zolanzo <info@zolanzo.com>.",
    );
    return { success: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender.from,
        to: [params.to],
        reply_to: sender.replyTo,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API Error:", errorText);
      return { success: false };
    }

    const data = (await response.json()) as { id?: string };
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return { success: false };
  }
}

/**
 * Resend API Email Service Engine
 */
export async function sendEmailOtp(
  email: string,
  code: string,
  recipientName: string = "User"
): Promise<{ success: boolean; id?: string }> {
  const html = getEmailOtpTemplate(code, recipientName);
  const text = getEmailOtpText(code, recipientName);
  const subject = `${code} is your ZOLANZO verification code`;
  const sender = getTransactionalEmailSender();
  captureDevOutboundEmail({
    email,
    purpose: EMAIL_OTP_PURPOSE.emailVerification,
    kind: "email_otp",
    capturedAt: new Date().toISOString(),
    code,
    from: sender.from,
    replyTo: sender.replyTo,
    subject,
    html,
    text,
  });

  if (!process.env.RESEND_API_KEY?.trim() && !isLiveEmailRequired()) {
    console.warn("[DEV MODE] Email OTP issued; code captured locally, not logged.");
  }

  return postResendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

export async function sendPinResetEmail(
  email: string,
  code: string,
  recipientName: string = "User"
): Promise<{ success: boolean; id?: string }> {
  const html = getPinResetTemplate(code, recipientName);
  const text = getPinResetText(code, recipientName);
  const subject = `Reset your ZOLANZO security PIN`;
  const sender = getTransactionalEmailSender();
  captureDevOutboundEmail({
    email,
    purpose: EMAIL_OTP_PURPOSE.pinReset,
    kind: "pin_reset",
    capturedAt: new Date().toISOString(),
    code,
    from: sender.from,
    replyTo: sender.replyTo,
    subject,
    html,
    text,
  });

  if (!process.env.RESEND_API_KEY?.trim() && !isLiveEmailRequired()) {
    console.warn("[DEV MODE] PIN reset email issued; code captured locally, not logged.");
  }

  return postResendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

export async function sendSecurityAlert(
  email: string,
  actionName: string,
  ipAddress: string,
  device: string
): Promise<boolean> {
  const html = getSecurityAlertTemplate(actionName, ipAddress, device);
  const text = getSecurityAlertText(actionName, ipAddress, device);

  if (!process.env.RESEND_API_KEY?.trim() && !isLiveEmailRequired()) {
    console.warn("[DEV MODE] Security alert issued; not sent.");
    return true;
  }

  const result = await postResendEmail({
    to: email,
    subject: `Security Alert: ${actionName}`,
    html,
    text,
  });
  return result.success;
}
