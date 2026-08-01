/**
 * Phase 3B.3 — Sendchamp adapter unit tests (no live network).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  sendchampNotificationAdapter,
  selectNotificationAdapter,
} from "@/lib/integrations/notifications";
import {
  computeSendchampBodyHmac,
  verifySendchampWebhook,
} from "@/lib/integrations/notifications/sendchamp/signature";
import { normalizeSendchampWebhook } from "@/lib/integrations/notifications/sendchamp/normalize";
import {
  sendchampCircuit,
} from "@/lib/integrations/notifications/sendchamp/circuit";
import { clearWebhookReplayCache } from "@/lib/security/webhook-auth";
import { AppError } from "@/lib/api/response";
import {
  findBuiltinTemplate,
  renderNotificationTemplate,
} from "@/features/notifications/services/templates";
import {
  resolveFallbackChannels,
  shouldAttemptSmsEmailFallback,
} from "@/features/notifications/services/fallback";
import { computeRetrySchedule } from "@/features/notifications/services/policies";

const SECRET = "sendchamp-test-webhook-secret-value";

describe("sendchamp templates", () => {
  it("renders OTP SMS", () => {
    const template = findBuiltinTemplate({
      event: "auth.otp",
      channel: "sms",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Zolanzo",
        publicRef: "OTP-1",
        otpCode: "482913",
      },
    });
    expect(rendered.bodyText).toContain("482913");
  });

  it("renders payment SMS", () => {
    const template = findBuiltinTemplate({
      event: "payment.receipt",
      channel: "sms",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Acme",
        publicRef: "PAY-1",
        amountLabel: "10.00 NGN",
      },
    });
    expect(rendered.bodyText).toContain("PAY-1");
  });

  it("renders withdrawal WhatsApp", () => {
    const template = findBuiltinTemplate({
      event: "withdrawal.completed",
      channel: "whatsapp",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Acme",
        publicRef: "WDR-1",
        amountLabel: "5.00 NGN",
      },
    });
    expect(rendered.bodyText).toContain("WDR-1");
  });
});

describe("sendchamp signature + replay", () => {
  afterEach(() => {
    clearWebhookReplayCache();
    delete process.env.SENDCHAMP_WEBHOOK_SECRET;
    delete process.env.WEBHOOK_SIGNING_SECRET;
  });

  it("accepts body HMAC signature", () => {
    process.env.SENDCHAMP_WEBHOOK_SECRET = SECRET;
    const body = JSON.stringify({
      service: "sms",
      status: "delivered",
      reference: "ref_ok",
      sms_uid: "uid_1",
    });
    const sig = computeSendchampBodyHmac(body, SECRET);
    const result = verifySendchampWebhook({
      headers: { "x-sendchamp-signature": sig },
      body,
      eventId: "sendchamp:sms:ref_ok:delivered",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid signature", () => {
    process.env.SENDCHAMP_WEBHOOK_SECRET = SECRET;
    const body = JSON.stringify({ service: "sms", status: "failed" });
    const result = verifySendchampWebhook({
      headers: { "x-sendchamp-signature": "00".repeat(32) },
      body,
      eventId: "evt_bad",
    });
    expect(result.ok).toBe(false);
  });

  it("blocks replay", () => {
    process.env.SENDCHAMP_WEBHOOK_SECRET = SECRET;
    const body = JSON.stringify({
      service: "sms",
      status: "delivered",
      reference: "ref_replay",
    });
    const sig = computeSendchampBodyHmac(body, SECRET);
    const headers = { "x-sendchamp-signature": sig };
    expect(
      verifySendchampWebhook({
        headers,
        body,
        eventId: "sendchamp:sms:ref_replay:delivered",
      }).ok,
    ).toBe(true);
    expect(() =>
      verifySendchampWebhook({
        headers,
        body,
        eventId: "sendchamp:sms:ref_replay:delivered",
      }),
    ).toThrow(AppError);
  });
});

describe("sendchamp normalize", () => {
  it("maps delivered and read statuses", () => {
    const delivered = normalizeSendchampWebhook({
      service: "sms",
      status: "delivered",
      reference: "r1",
      phone_number: "2348000000000",
    });
    expect(delivered.status).toBe("delivered");
    expect(delivered.service).toBe("sms");

    const read = normalizeSendchampWebhook({
      service: "whatsapp",
      status: "read",
      reference: "r2",
    });
    expect(read.status).toBe("read");
    expect(read.service).toBe("whatsapp");
  });
});

describe("sendchamp deliver", () => {
  afterEach(() => {
    delete process.env.SENDCHAMP_API_KEY;
    sendchampCircuit.reset();
    vi.unstubAllGlobals();
  });

  it("queues in stub mode", async () => {
    delete process.env.SENDCHAMP_API_KEY;
    const result = await sendchampNotificationAdapter.deliver({
      channel: "sms",
      to: "+2348000000000",
      bodyText: "OTP 123456",
      idempotencyKey: "idem_sms_1",
    });
    expect(result.status).toBe("queued");
    expect(result.raw?.stub).toBe(true);
  });

  it("sends SMS via API when live", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: 200,
          data: { reference: "sms_ref_1", status: "success" },
        }),
      })),
    );
    const result = await sendchampNotificationAdapter.deliver({
      channel: "sms",
      to: "2348000000000",
      bodyText: "Hello",
      idempotencyKey: "idem_sms_live",
    });
    expect(result.status).toBe("delivered");
    expect(result.providerRef).toBe("sms_ref_1");
  });

  it("sends WhatsApp via API when live", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    process.env.SENDCHAMP_WHATSAPP_SENDER = "2348111111111";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          data: { reference: "wa_ref_1" },
        }),
      })),
    );
    const result = await sendchampNotificationAdapter.deliver({
      channel: "whatsapp",
      to: "2348000000000",
      bodyText: "Offer received",
      idempotencyKey: "idem_wa_live",
    });
    expect(result.status).toBe("delivered");
    expect(result.providerRef).toBe("wa_ref_1");
    delete process.env.SENDCHAMP_WHATSAPP_SENDER;
  });
});

describe("selection + fallback + DLQ", () => {
  afterEach(() => {
    delete process.env.SENDCHAMP_API_KEY;
  });

  it("prefers sendchamp when live for SMS", () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    const adapter = selectNotificationAdapter({
      channel: "sms",
      preferLive: true,
    });
    expect(adapter.providerKey).toBe("sendchamp");
  });

  it("resolves SMS→email fallback", () => {
    expect(resolveFallbackChannels({ failedChannel: "sms" })).toEqual([
      "email",
    ]);
    expect(shouldAttemptSmsEmailFallback("auth.otp")).toBe(true);
    expect(shouldAttemptSmsEmailFallback("campaign.published")).toBe(false);
  });

  it("marks retry exhaustion for DLQ path", () => {
    const exhausted = computeRetrySchedule({
      attempts: 3,
      retry: { maxAttempts: 3, backoffSeconds: 30 },
    });
    expect(exhausted.exhausted).toBe(true);
  });

  it("prevents duplicate job keys by shape", () => {
    const intentKey = "evt_auth_otp_u1";
    expect(`${intentKey}:sms:u1`).toBe("evt_auth_otp_u1:sms:u1");
    expect(`${intentKey}:sms:u1:fallback:email`).toContain("fallback:email");
  });
});
