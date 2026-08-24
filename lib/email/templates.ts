/**
 * Branded HTML Email Templates for ZOLANZO
 */

import { APP_CONFIG } from "@/config/app";

export function getEmailOtpTemplate(code: string, recipientName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ZOLANZO Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #04090B; color: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0A0F12; border: 1px solid #1f2937; border-radius: 24px; padding: 36px; text-align: center;">
    <div style="margin-bottom: 24px;">
      <h1 style="color: #008744; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.02em;">ZOLANZO</h1>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 4px;">Africa's Digital Workforce Marketplace</p>
    </div>

    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Verify Your Email Address</h2>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
      Hello ${recipientName}, use the 6-digit verification code below to complete your registration on ZOLANZO.
    </p>

    <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 0.3em; color: #10b981;">${code}</span>
    </div>

    <p style="color: #6b7280; font-size: 12px; margin-bottom: 24px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>

    <hr style="border: 0; border-top: 1px solid #1f2937; margin-bottom: 24px;" />
    <p style="color: #4b5563; font-size: 11px; margin: 0;">© 2026 ZOLANZO LTD • A Stankings Company • stankings.com</p>
  </div>
</body>
</html>
  `;
}

export function getPinResetTemplate(code: string, recipientName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ZOLANZO PIN Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #04090B; color: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0A0F12; border: 1px solid #1f2937; border-radius: 24px; padding: 36px; text-align: center;">
    <div style="margin-bottom: 24px;">
      <h1 style="color: #008744; font-size: 28px; font-weight: 900; margin: 0;">ZOLANZO</h1>
    </div>

    <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Reset Security PIN</h2>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
      Hello ${recipientName}, we received a request to reset your ZOLANZO 6-digit security PIN. Use the code below:
    </p>

    <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 0.3em; color: #10b981;">${code}</span>
    </div>

    <p style="color: #6b7280; font-size: 12px;">If you did not request a PIN reset, please contact support immediately on WhatsApp at ${APP_CONFIG.supportWhatsApp.display} (<a href="${APP_CONFIG.supportWhatsApp.href}" style="color: #10b981;">wa.me/2347045559401</a>).</p>
  </div>
</body>
</html>
  `;
}

export function getSecurityAlertTemplate(actionName: string, ipAddress: string, device: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Security Alert</title></head>
<body style="font-family: sans-serif; background-color: #04090B; color: #ffffff; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #0A0F12; border: 1px solid #1f2937; border-radius: 24px; padding: 36px;">
    <h2 style="color: #ef4444; margin-top: 0;">Security Alert: ${actionName}</h2>
    <p style="color: #9ca3af; font-size: 14px;">A new ${actionName} occurred on your account.</p>
    <ul style="color: #d1d5db; font-size: 13px; line-height: 1.8;">
      <li><strong>IP Address:</strong> ${ipAddress}</li>
      <li><strong>Device:</strong> ${device}</li>
      <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
    </ul>
  </div>
</body>
</html>
  `;
}
