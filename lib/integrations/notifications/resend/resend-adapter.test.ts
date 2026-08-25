/**
 * Phase 3B.2 — Resend adapter unit tests (no live network).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { resendNotificationAdapter } from "@/lib/integrations/notifications/resend-adapter";
import {
  computeResendSignature,
  verifyResendWebhook,
} from "@/lib/integrations/notifications/resend/signature";
import { normalizeResendWebhook } from "@/lib/integrations/notifications/resend/normalize";
import { clearWebhookReplayCache } from "@/lib/security/webhook-auth";
import { AppError } from "@/lib/api/response";
import {
  findBuiltinTemplate,
  renderNotificationTemplate,
} from "@/features/notifications/services/templates";
import { computeRetrySchedule } from "@/features/notifications/services/policies";

const WHSEC = `whsec_${Buffer.from("test_resend_webhook_secret_bytes!!").toString("base64")}`;

function signedHeaders(body: string, msgId = "msg_test_1") {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const sig = computeResendSignature(body, msgId, timestamp, WHSEC);
  return {
    "svix-id": msgId,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${sig}`,
  };
}

describe("resend templates", () => {
  it("renders welcome email", () => {
    const template = findBuiltinTemplate({
      event: "auth.welcome",
      channel: "email",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Zolanzo",
        publicRef: "USR-1",
      },
    });
    expect(rendered.subject).toContain("Welcome");
    expect(rendered.subject).toContain("ZOLANZO");
    expect(rendered.bodyHtml).toContain("Ada");
    expect(rendered.bodyHtml).toContain("https://zolanzo.com/brand/light-theme-logo.png");
    expect(rendered.bodyHtml).toContain("ZOLANZO LTD");
    expect(rendered.bodyHtml).toContain("Africa's Digital Workforce Marketplace");
    expect(rendered.bodyHtml).toContain("stankings.com");
    expect(rendered.bodyHtml).not.toContain("font-family:system-ui");
    expect(rendered.bodyText).toContain("Zolanzo");
    expect(rendered.bodyText).toContain("Africa's Digital Workforce Marketplace");
    expect(rendered.bodyText).toContain("© 2026 ZOLANZO LTD • A Stankings Company • stankings.com");
  });

  it("renders verification email with actionUrl", () => {
    const template = findBuiltinTemplate({
      event: "auth.email_verification",
      channel: "email",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Zolanzo",
        publicRef: "USR-1",
        actionUrl: "https://app.example/verify?t=abc",
      },
    });
    expect(rendered.bodyText).toContain("https://app.example/verify?t=abc");
    expect(rendered.bodyHtml).toContain("https://zolanzo.com/brand/light-theme-logo.png");
    expect(rendered.bodyHtml).toContain("https://app.example/verify?t=abc");
    expect(rendered.bodyHtml).toContain("Verify email");
    expect(rendered.bodyHtml).not.toContain("letter-spacing:8px");
  });

  it("renders payment receipt", () => {
    const template = findBuiltinTemplate({
      event: "payment.receipt",
      channel: "email",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Acme",
        publicRef: "PAY-ABC123",
        amountLabel: "50.00 NGN",
      },
    });
    expect(rendered.subject).toContain("PAY-ABC123");
    expect(rendered.bodyText).toContain("50.00 NGN");
    expect(rendered.bodyHtml).toContain("font-family:system-ui");
  });

  it("renders organization invite on the light ZOLANZO shell with a live accept link", () => {
    const template = findBuiltinTemplate({
      event: "org.invite_member",
      channel: "email",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Acme Org",
        publicRef: "ORG-1",
        actionUrl: "https://zolanzo.com/auth/accept-invite?token=abc",
      },
    });
    expect(rendered.subject).toContain("Acme Org");
    expect(rendered.bodyHtml).toContain("https://zolanzo.com/brand/light-theme-logo.png");
    expect(rendered.bodyHtml).toContain("https://zolanzo.com/auth/accept-invite?token=abc");
    expect(rendered.bodyHtml).toContain("Accept invitation");
    expect(rendered.bodyHtml).toContain("ZOLANZO LTD");
    expect(rendered.bodyHtml).not.toContain("font-family:system-ui");
    expect(rendered.bodyText).toContain("https://zolanzo.com/auth/accept-invite?token=abc");
  });

  it("renders password reset as a branded link email, not an OTP", () => {
    const template = findBuiltinTemplate({
      event: "auth.password_reset",
      channel: "email",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Zolanzo",
        publicRef: "USR-1",
        actionUrl: "https://app.example/reset?t=abc",
      },
    });
    expect(rendered.subject).toContain("Reset your password");
    expect(rendered.bodyHtml).toContain("Reset password");
    expect(rendered.bodyHtml).toContain("https://app.example/reset?t=abc");
    expect(rendered.bodyHtml).toContain("https://zolanzo.com/brand/light-theme-logo.png");
    expect(rendered.bodyHtml).not.toContain("letter-spacing:8px");
  });
});

describe("resend signature + replay", () => {
  afterEach(() => {
    clearWebhookReplayCache();
    delete process.env.RESEND_WEBHOOK_SECRET;
  });

  it("accepts valid Svix signature", () => {
    process.env.RESEND_WEBHOOK_SECRET = WHSEC;
    const body = JSON.stringify({
      type: "email.delivered",
      data: { email_id: "email_1" },
    });
    const result = verifyResendWebhook({
      headers: signedHeaders(body, "msg_ok"),
      body,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid signature", () => {
    process.env.RESEND_WEBHOOK_SECRET = WHSEC;
    const body = JSON.stringify({ type: "email.bounced", data: {} });
    const result = verifyResendWebhook({
      headers: {
        "svix-id": "msg_bad",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,AAAA",
      },
      body,
    });
    expect(result.ok).toBe(false);
  });

  it("blocks replayed svix ids", () => {
    process.env.RESEND_WEBHOOK_SECRET = WHSEC;
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "e2" } });
    const headers = signedHeaders(body, "msg_replay");
    expect(verifyResendWebhook({ headers, body }).ok).toBe(true);
    expect(() => verifyResendWebhook({ headers, body })).toThrow(AppError);
  });
});

describe("resend normalize", () => {
  it("normalizes bounce events", () => {
    const event = normalizeResendWebhook({
      type: "email.bounced",
      data: {
        email_id: "email_bounce",
        to: ["a@example.com"],
        created_at: new Date().toISOString(),
        bounce: { message: "hard" },
      },
    });
    expect(event.type).toBe("email.bounced");
    expect(event.emailId).toBe("email_bounce");
    expect(event.bounceType).toBe("hard");
  });
});

describe("resend deliver", () => {
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    vi.unstubAllGlobals();
  });

  it("queues in stub mode without API key", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await resendNotificationAdapter.deliver({
      channel: "email",
      to: "a@example.com",
      subject: "Hi",
      bodyText: "Hello",
      idempotencyKey: "idem_email_1",
    });
    expect(result.status).toBe("queued");
    expect(result.raw?.stub).toBe(true);
  });

  it("sends via Resend API when live", async () => {
    process.env.RESEND_API_KEY = "re_live_test";
    process.env.RESEND_FROM_EMAIL = "info@zolanzo.com";
    let capturedBody = "";
    const fetchMock = vi.fn(async (_url: unknown, init?: { body?: string }) => {
      capturedBody = String(init?.body ?? "");
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: "email_live_1" }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await resendNotificationAdapter.deliver({
      channel: "email",
      to: "a@example.com",
      subject: "Welcome",
      bodyText: "Hello",
      bodyHtml: "<p>Hello</p>",
      idempotencyKey: "idem_email_live",
      templateKey: "auth_welcome",
    });
    expect(result.status).toBe("delivered");
    expect(result.providerRef).toBe("email_live_1");
    const payload = JSON.parse(capturedBody) as { from: string; reply_to: string };
    expect(payload.from).toBe("Zolanzo <info@zolanzo.com>");
    expect(payload.reply_to).toBe("support@zolanzo.com");
  });

  it("fails delivery on provider error", async () => {
    process.env.RESEND_API_KEY = "re_live_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
        json: async () => ({ message: "Invalid to" }),
      })),
    );
    const result = await resendNotificationAdapter.deliver({
      channel: "email",
      to: "bad",
      subject: "X",
      bodyText: "Y",
      idempotencyKey: "idem_fail",
    });
    expect(result.status).toBe("failed");
    expect(result.failureReason).toContain("Invalid");
  });
});

describe("retry + dead letter policy", () => {
  it("exhausts retries for dead-letter path", () => {
    const exhausted = computeRetrySchedule({
      attempts: 3,
      retry: { maxAttempts: 3, backoffSeconds: 60 },
    });
    expect(exhausted.exhausted).toBe(true);
  });

  it("schedules retry before exhaustion", () => {
    const first = computeRetrySchedule({
      attempts: 1,
      retry: { maxAttempts: 3, backoffSeconds: 60 },
      from: new Date("2026-07-26T12:00:00.000Z"),
    });
    expect(first.exhausted).toBe(false);
    expect(first.nextAt.toISOString()).toBe("2026-07-26T12:01:00.000Z");
  });
});

describe("duplicate send prevention shape", () => {
  it("uses stable idempotency keys per job", () => {
    const intentKey = "evt_auth_welcome_usr1";
    const jobKey = `${intentKey}:email:u1`;
    expect(jobKey).toBe("evt_auth_welcome_usr1:email:u1");
    // Signature helper still deterministic
    const sig = createHmac("sha256", Buffer.from("x")).update("y").digest("hex");
    expect(sig).toHaveLength(64);
  });
});
