/**
 * Resend email channel adapter — production-grade.
 * Live when RESEND_API_KEY is set; stub otherwise.
 * Domain must only use NotificationChannelAdapter ports.
 */

import type {
  ChannelDeliveryInput,
  ChannelDeliveryResult,
  NotificationChannelAdapter,
} from "@/lib/integrations/types";
import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";
import {
  getResendFromAddress,
  getResendReplyToAddress,
  isResendFromIdentityReady,
  isResendLiveMode,
  resendRequest,
  type ResendSendEmailData,
} from "@/lib/integrations/notifications/resend/client";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";

const CAPABILITIES = ["email", "templates", "priority"] as const;

const stub = createStubChannelAdapter({
  providerKey: "resend",
  channels: ["email"],
  capabilities: CAPABILITIES,
});

/**
 * Open-tracking hook: optional pixel URL via metadata / env.
 * Resend also supports native open tracking; this keeps a domain-owned hook.
 */
function withOpenTrackingHook(
  html: string | undefined,
  idempotencyKey: string,
): string | undefined {
  if (!html) return html;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) return html;
  const pixel = `<img src="${base}/api/email/open?k=${encodeURIComponent(idempotencyKey)}" width="1" height="1" alt="" style="display:none" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return `${html}${pixel}`;
}

async function deliverLive(
  input: ChannelDeliveryInput,
): Promise<ChannelDeliveryResult> {
  if (input.channel !== "email") {
    return {
      provider: "resend",
      providerRef: "resend_unsupported",
      status: "failed",
      failureReason: "Resend adapter only supports email",
    };
  }

  if (!isResendFromIdentityReady()) {
    return {
      provider: "resend",
      providerRef: "resend_sender_unconfigured",
      status: "failed",
      failureReason:
        "Production mail cannot use the Resend sandbox sender. Verify zolanzo.com in Resend for info@zolanzo.com.",
    };
  }

  const tags = [
    { name: "idempotency_key", value: input.idempotencyKey.slice(0, 40) },
  ];
  if (input.templateKey) {
    tags.push({ name: "template", value: input.templateKey.slice(0, 40) });
  }

  const result = await resendRequest<ResendSendEmailData>({
    method: "POST",
    path: "/emails",
    body: {
      from: getResendFromAddress(),
      to: [input.to],
      reply_to: getResendReplyToAddress(),
      subject: input.subject ?? "ZOLANZO notification",
      text: input.bodyText,
      html: withOpenTrackingHook(input.bodyHtml, input.idempotencyKey),
      headers: {
        "X-Entity-Ref-ID": input.idempotencyKey,
        "X-Zolanzo-Idempotency-Key": input.idempotencyKey,
      },
      tags,
    },
  });

  if (!result.ok) {
    metrics.notification({ channel: "email", outcome: "failed" });
    logger.warn("Resend deliver failed", {
      span: "resend.deliver",
      message: result.message,
      status: result.status,
    });
    return {
      provider: "resend",
      providerRef: `resend_fail_${input.idempotencyKey.slice(0, 16)}`,
      status: "failed",
      failureReason: result.message,
      raw: { live: true, error: result.raw ?? result.message },
    };
  }

  metrics.notification({ channel: "email", outcome: "delivered" });
  return {
    provider: "resend",
    providerRef: result.data.id,
    status: "delivered",
    deliveredAt: new Date().toISOString(),
    raw: { live: true, id: result.data.id },
  };
}

export const resendNotificationAdapter: NotificationChannelAdapter = {
  providerKey: "resend",
  channels: ["email"],
  capabilities: CAPABILITIES,

  async deliver(input) {
    if (!isResendLiveMode()) {
      return stub.deliver(input);
    }
    return deliverLive(input);
  },
};

export function resendAdapterMode(): "live" | "stub" {
  return isResendLiveMode() ? "live" : "stub";
}
