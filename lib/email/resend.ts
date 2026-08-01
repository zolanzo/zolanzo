import { getEmailOtpTemplate, getPinResetTemplate, getSecurityAlertTemplate } from "./templates";

/**
 * Resend API Email Service Engine
 */
export async function sendEmailOtp(
  email: string,
  code: string,
  recipientName: string = "User"
): Promise<{ success: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "ZOLANZO <noreply@zolanzo.com>";

  const html = getEmailOtpTemplate(code, recipientName);

  if (!apiKey) {
    console.warn(`[DEV MODE] Email OTP to ${email}: ${code}`);
    return { success: true, id: `dev_otp_${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${code} is your ZOLANZO verification code`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API Error:", errorText);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Failed to send email OTP via Resend:", error);
    return { success: false };
  }
}

export async function sendPinResetEmail(
  email: string,
  code: string,
  recipientName: string = "User"
): Promise<{ success: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "ZOLANZO <noreply@zolanzo.com>";

  const html = getPinResetTemplate(code, recipientName);

  if (!apiKey) {
    console.warn(`[DEV MODE] PIN Reset Email to ${email}: ${code}`);
    return { success: true, id: `dev_reset_${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Reset your ZOLANZO security PIN`,
        html,
      }),
    });

    return { success: response.ok };
  } catch {
    return { success: false };
  }
}

export async function sendSecurityAlert(
  email: string,
  actionName: string,
  ipAddress: string,
  device: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "ZOLANZO Security <noreply@zolanzo.com>";

  const html = getSecurityAlertTemplate(actionName, ipAddress, device);

  if (!apiKey) {
    console.warn(`[DEV MODE] Security Alert to ${email}: ${actionName}`);
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Security Alert: ${actionName}`,
        html,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
