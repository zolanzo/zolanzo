/**
 * Shared ZOLANZO transactional email design system.
 * Table-based, inline-styled, light-mode, Gmail/Outlook/mobile safe.
 */

import { APP_CONFIG } from "@/config/app";
import { BRAND } from "@/constants/brand";
import { COLOR } from "@/constants/design-tokens";
import { EMAIL_OTP_TTL_MS } from "@/lib/auth/email-otp-constants";

export const EMAIL_BRAND_TAGLINE = "Africa's Digital Workforce Marketplace";
export const EMAIL_FOOTER_TEXT =
  "© 2026 ZOLANZO LTD • A Stankings Company • stankings.com";
export const EMAIL_STANKINGS_URL = "https://stankings.com";

const FONT = "Arial,Helvetica,sans-serif";
const PAGE_BG = COLOR.lightBackground;
const CARD_BG = COLOR.lightSurface;
const TEXT = COLOR.navy;
const MUTED = "#475569";
const SUBTLE = "#64748B";
const BORDER = COLOR.borderLight;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(recipientName: string): string {
  const raw = recipientName.trim();
  if (!raw || raw.includes("@")) return "there";
  return raw.split(/\s+/)[0] || "there";
}

/** Absolute HTTPS URL — relative /brand paths do not load in inboxes. */
export function emailLogoUrl(): string {
  return `${BRAND.url.replace(/\/$/, "")}/brand/light-theme-logo.png`;
}

function otpExpiryMinutes(): number {
  return Math.max(1, Math.round(EMAIL_OTP_TTL_MS / 60_000));
}

export function formatTransactionalPlainText(params: {
  heading: string;
  body: string;
  code?: string;
  note?: string;
}): string {
  const blocks = [
    BRAND.name,
    EMAIL_BRAND_TAGLINE,
    "",
    params.heading,
    "",
    params.body.trim(),
  ];
  if (params.code) {
    blocks.push("", params.code);
  }
  if (params.note?.trim()) {
    blocks.push("", params.note.trim());
  }
  blocks.push("", EMAIL_FOOTER_TEXT);
  return blocks.join("\n");
}

function lightEmailShell(title: string, inner: string, preheader?: string): string {
  const logo = emailLogoUrl();
  const preview = escapeHtml(preheader || title);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light only; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: ${PAGE_BG}; }
    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; max-width: 100% !important; }
      .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .email-logo { width: 132px !important; height: auto !important; }
      .otp-code { font-size: 26px !important; line-height: 32px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:${PAGE_BG};">
    ${preview}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${PAGE_BG}" style="background-color:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="email-card" cellpadding="0" cellspacing="0" border="0" width="520" bgcolor="${CARD_BG}" style="width:520px;max-width:520px;background-color:${CARD_BG};border:1px solid ${BORDER};">
          <tr>
            <td class="email-pad" align="center" style="padding:28px 28px 20px 28px;font-family:${FONT};border-bottom:1px solid ${BORDER};">
              <img class="email-logo" src="${logo}" alt="ZOLANZO" width="152" height="37" style="display:block;width:152px;height:auto;max-width:152px;border:0;margin:0 auto;" />
              <p style="margin:12px 0 0 0;font-family:${FONT};font-size:12px;line-height:18px;font-weight:400;letter-spacing:0.04em;color:${SUBTLE};">${EMAIL_BRAND_TAGLINE}</p>
            </td>
          </tr>
          <tr>
            <td class="email-pad" align="left" style="padding:28px 28px 8px 28px;font-family:${FONT};">
              ${inner}
            </td>
          </tr>
          <tr>
            <td class="email-pad" align="center" style="padding:16px 28px 24px 28px;border-top:1px solid ${BORDER};font-family:${FONT};font-size:12px;line-height:18px;color:${SUBTLE};">
              © 2026 ZOLANZO LTD • A Stankings Company • <a href="${EMAIL_STANKINGS_URL}" style="color:${SUBTLE};text-decoration:underline;">stankings.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function kicker(label: string): string {
  return `
              <p style="margin:0 0 8px 0;font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${COLOR.primary};">${escapeHtml(label)}</p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:700;color:${TEXT};">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string, extraMargin = "0 0 16px 0"): string {
  return `<p style="margin:${extraMargin};font-family:${FONT};font-size:15px;line-height:22px;color:${TEXT};">${text}</p>`;
}

function noteParagraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${text}</p>`;
}

function codeBlock(safeCode: string): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px 0;">
                <tr>
                  <td align="center" bgcolor="${PAGE_BG}" style="background-color:${PAGE_BG};border:1px solid ${BORDER};border-top:3px solid ${COLOR.primary};padding:20px 16px;">
                    <p class="otp-code" style="margin:0;font-family:${FONT};font-size:32px;line-height:40px;font-weight:700;color:${TEXT};">${safeCode}</p>
                  </td>
                </tr>
              </table>`;
}

function actionButton(label: string, url: string): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
                <tr>
                  <td align="center" bgcolor="${COLOR.primary}" style="background-color:${COLOR.primary};">
                    <a href="${url}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;line-height:18px;font-weight:700;color:#FFFFFF;text-decoration:none;">${escapeHtml(label)}</a>
                  </td>
                </tr>
              </table>`;
}

/**
 * Shared light-mode shell for auth emails whose action is a message or link,
 * not a 6-digit code. Placeholders such as {{recipientName}} are left intact
 * for the notification hub interpolator.
 */
export function getBrandedAuthMessageTemplate(params: {
  title: string;
  kicker: string;
  heading: string;
  recipientName: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  code?: string;
  note?: string;
}): string {
  const name = escapeHtml(params.recipientName);
  const body = escapeHtml(params.body);
  const note = params.note ? escapeHtml(params.note) : "";
  const action =
    params.actionLabel && params.actionUrl
      ? actionButton(params.actionLabel, params.actionUrl)
      : "";
  const code = params.code ? codeBlock(escapeHtml(params.code)) : "";

  return lightEmailShell(
    params.title,
    `
              ${kicker(params.kicker)}
              ${heading(params.heading)}
              ${paragraph(`Hello ${name},`)}
              ${paragraph(body)}
              ${code}
              ${action}
              ${note ? noteParagraph(note) : ""}
    `,
  );
}

export function getEmailOtpTemplate(code: string, recipientName: string): string {
  const name = escapeHtml(firstName(recipientName));
  const safeCode = escapeHtml(code);
  const minutes = otpExpiryMinutes();
  return lightEmailShell(
    "ZOLANZO Verification Code",
    `
              ${heading("Verify Your Email Address")}
              ${paragraph(`Hello ${name}, use the 6-digit verification code below to complete your registration on ZOLANZO.`)}
              ${codeBlock(safeCode)}
              ${noteParagraph(`This code will expire in ${minutes} minutes. If you did not request this code, please ignore this email.`)}
    `,
    "Verify your ZOLANZO email address",
  );
}

export function getEmailOtpText(code: string, recipientName: string): string {
  const name = firstName(recipientName);
  const minutes = otpExpiryMinutes();
  return formatTransactionalPlainText({
    heading: "Verify Your Email Address",
    body: `Hello ${name}, use the 6-digit verification code below to complete your registration on ZOLANZO.`,
    code,
    note: `This code will expire in ${minutes} minutes. If you did not request this code, please ignore this email.`,
  });
}

export function getPinResetTemplate(code: string, recipientName: string): string {
  const name = escapeHtml(firstName(recipientName));
  const safeCode = escapeHtml(code);
  const minutes = otpExpiryMinutes();
  return lightEmailShell(
    "ZOLANZO PIN Reset",
    `
              ${kicker("PIN Recovery")}
              ${heading("Reset your security PIN")}
              ${paragraph(`Hello ${name}, we received a request to reset your ZOLANZO 6-digit security PIN. Use the code below:`)}
              ${codeBlock(safeCode)}
              ${noteParagraph(`This code will expire in ${minutes} minutes. If you did not request a PIN reset, please contact support on WhatsApp at ${escapeHtml(APP_CONFIG.supportWhatsApp.display)}.`)}
    `,
    "Reset your ZOLANZO security PIN",
  );
}

export function getPinResetText(code: string, recipientName: string): string {
  const name = firstName(recipientName);
  const minutes = otpExpiryMinutes();
  return formatTransactionalPlainText({
    heading: "Reset your security PIN",
    body: `Hello ${name}, we received a request to reset your ZOLANZO 6-digit security PIN. Use the code below:`,
    code,
    note: `This code will expire in ${minutes} minutes. If you did not request a PIN reset, please contact support on WhatsApp at ${APP_CONFIG.supportWhatsApp.display}.`,
  });
}

export function getSecurityAlertTemplate(actionName: string, ipAddress: string, device: string): string {
  return lightEmailShell(
    "ZOLANZO Security Alert",
    `
              ${kicker("Security Alert")}
              ${heading(`Security alert: ${actionName}`)}
              ${paragraph(`A new ${escapeHtml(actionName)} occurred on your account.`)}
              ${noteParagraph(`<strong style="color:${TEXT};">IP address:</strong> ${escapeHtml(ipAddress)}<br><strong style="color:${TEXT};">Device:</strong> ${escapeHtml(device)}<br><strong style="color:${TEXT};">Time:</strong> ${escapeHtml(new Date().toUTCString())}`)}
    `,
    "A security alert on your ZOLANZO account",
  );
}

export function getSecurityAlertText(actionName: string, ipAddress: string, device: string): string {
  return formatTransactionalPlainText({
    heading: `Security alert: ${actionName}`,
    body: `A new ${actionName} occurred on your account.`,
    note: `IP address: ${ipAddress}\nDevice: ${device}\nTime: ${new Date().toUTCString()}`,
  });
}
