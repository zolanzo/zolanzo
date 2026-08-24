/**
 * Sendchamp SMS + WhatsApp channel adapter — production-grade.
 * Live when SENDCHAMP_API_KEY is set; stub otherwise.
 * Domain must only use NotificationChannelAdapter ports.
 */

import type {
  ChannelDeliveryInput,
  ChannelDeliveryResult,
  NotificationChannelAdapter,
} from "@/lib/integrations/types";
import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";
import {
  getSendchampSenderId,
  getSendchampWhatsappSender,
  isSendchampLiveMode,
  normalizeSendchampMsisdn,
  sendchampRequest,
  type SendchampSmsData,
  type SendchampWhatsappData,
} from "@/lib/integrations/notifications/sendchamp/client";
import { sendchampCircuit } from "@/lib/integrations/notifications/sendchamp/circuit";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";
import { getCorrelationId } from "@/lib/observability/request-context";

const CAPABILITIES = ["sms", "whatsapp", "templates", "priority"] as const;

const stub = createStubChannelAdapter({
  providerKey: "sendchamp",
  channels: ["sms", "whatsapp"],
  capabilities: CAPABILITIES,
});

function normalizePhone(to: string): string {
  return normalizeSendchampMsisdn(to);
}

function providerRefFrom(
  data: SendchampSmsData | SendchampWhatsappData,
  fallback: string,
): string {
  const businessId =
    "business_id" in data && data.business_id != null
      ? data.business_id
      : undefined;
  return String(
    data.reference ?? data.uid ?? data.message_id ?? businessId ?? fallback,
  );
}

async function deliverSms(
  input: ChannelDeliveryInput,
): Promise<ChannelDeliveryResult> {
  const result = await sendchampRequest<SendchampSmsData>({
    method: "POST",
    path: "/sms/send",
    body: {
      to: [normalizePhone(input.to)],
      message: input.bodyText,
      sender_name: getSendchampSenderId(),
      route: "non_dnd",
    },
  });

  if (!result.ok) {
    sendchampCircuit.recordFailure();
    metrics.notification({ channel: "sms", outcome: "failed" });
    return {
      provider: "sendchamp",
      providerRef: `sendchamp_fail_${input.idempotencyKey.slice(0, 16)}`,
      status: "failed",
      failureReason: result.message,
      raw: {
        live: true,
        channel: "sms",
        error: result.raw ?? result.message,
        correlationId: getCorrelationId() ?? null,
      },
    };
  }

  sendchampCircuit.recordSuccess();
  metrics.notification({ channel: "sms", outcome: "delivered" });
  return {
    provider: "sendchamp",
    providerRef: providerRefFrom(result.data, input.idempotencyKey),
    status: "delivered",
    deliveredAt: new Date().toISOString(),
    raw: {
      live: true,
      channel: "sms",
      data: result.data,
      correlationId: getCorrelationId() ?? null,
    },
  };
}

async function deliverWhatsapp(
  input: ChannelDeliveryInput,
): Promise<ChannelDeliveryResult> {
  const sender = getSendchampWhatsappSender() ?? getSendchampSenderId();
  const templateName = input.templateKey ?? input.metadata?.whatsappTemplate;
  const useTemplate =
    typeof templateName === "string" && templateName.length > 0;

  const body: Record<string, unknown> = useTemplate
    ? {
        recipient: normalizePhone(input.to),
        sender,
        type: "template",
        template_name: templateName,
        template_language: input.metadata?.locale ?? "en",
        variables: input.variables ?? {},
      }
    : {
        recipient: normalizePhone(input.to),
        sender,
        type: "text",
        message: input.bodyText,
      };

  // Media-ready: optional media URL in metadata (adapter passes through).
  if (typeof input.metadata?.mediaUrl === "string") {
    body.type = "media";
    body.media_url = input.metadata.mediaUrl;
    body.caption = input.bodyText;
  }

  const result = await sendchampRequest<SendchampWhatsappData>({
    method: "POST",
    path: "/whatsapp/message/send",
    body,
  });

  if (!result.ok) {
    sendchampCircuit.recordFailure();
    metrics.notification({ channel: "whatsapp", outcome: "failed" });
    return {
      provider: "sendchamp",
      providerRef: `sendchamp_wa_fail_${input.idempotencyKey.slice(0, 12)}`,
      status: "failed",
      failureReason: result.message,
      raw: {
        live: true,
        channel: "whatsapp",
        template: useTemplate,
        error: result.raw ?? result.message,
        correlationId: getCorrelationId() ?? null,
      },
    };
  }

  sendchampCircuit.recordSuccess();
  metrics.notification({ channel: "whatsapp", outcome: "delivered" });
  return {
    provider: "sendchamp",
    providerRef: providerRefFrom(result.data, input.idempotencyKey),
    status: "delivered",
    deliveredAt: new Date().toISOString(),
    raw: {
      live: true,
      channel: "whatsapp",
      template: useTemplate,
      data: result.data,
      correlationId: getCorrelationId() ?? null,
    },
  };
}

async function deliverLive(
  input: ChannelDeliveryInput,
): Promise<ChannelDeliveryResult> {
  if (!sendchampCircuit.allow()) {
    const snap = sendchampCircuit.snapshot();
    logger.warn("Sendchamp circuit open — failing fast", {
      span: "sendchamp.circuit",
      state: snap.state,
      failures: snap.failures,
    });
    return {
      provider: "sendchamp",
      providerRef: `sendchamp_circuit_${input.idempotencyKey.slice(0, 12)}`,
      status: "failed",
      failureReason: "circuit_open",
      raw: { circuit: snap },
    };
  }

  if (input.channel === "sms") return deliverSms(input);
  if (input.channel === "whatsapp") return deliverWhatsapp(input);

  return {
    provider: "sendchamp",
    providerRef: "sendchamp_unsupported",
    status: "failed",
    failureReason: `Sendchamp does not support channel ${input.channel}`,
  };
}

export const sendchampNotificationAdapter: NotificationChannelAdapter = {
  providerKey: "sendchamp",
  channels: ["sms", "whatsapp"],
  capabilities: CAPABILITIES,

  async deliver(input) {
    if (!isSendchampLiveMode()) {
      return stub.deliver(input);
    }
    return deliverLive(input);
  },
};

export function sendchampAdapterMode(): "live" | "stub" {
  return isSendchampLiveMode() ? "live" : "stub";
}

export function getSendchampCircuitHealth() {
  return sendchampCircuit.snapshot();
}
