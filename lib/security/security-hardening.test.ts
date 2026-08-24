import { afterEach, describe, expect, it } from "vitest";
import {
  assertCan,
  can,
} from "@/lib/rbac/access";
import {
  assertCampaignAccess,
  assertPaymentIntentAccess,
  assertSubmissionAccess,
  assertWalletAccess,
} from "@/lib/auth/resource-guards";
import {
  buildSignedWebhookHeaders,
  clearWebhookReplayCache,
  signWebhookBody,
  verifyWebhookRequest,
} from "@/lib/security/webhook-auth";
import { memoryPaymentAdapter } from "@/lib/integrations/payments";
import { AppError } from "@/lib/api/response";
import type { ActorContext } from "@/types/domain";
import type { SessionUser } from "@/lib/auth/session";

afterEach(() => {
  clearWebhookReplayCache();
  delete process.env.WEBHOOK_SIGNING_SECRET;
  delete process.env.WEBHOOK_SIGNING_SECRETS;
});

function actor(userId: string): ActorContext {
  return {
    userId: userId as ActorContext["userId"],
    accountType: "individual",
    userTypes: [],
    participation: "worker",
    tenant: { organizationId: null, workspaceId: null, teamIds: [] },
    orgRoles: [],
    isAuthenticated: true,
  };
}

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user_a",
    authSubject: "auth_a",
    email: "a@example.com",
    accountType: "individual",
    participation: "worker",
    platformRoles: ["worker"],
    activeOrganizationId: "org_a",
    profile: null,
    memberships: [
      {
        organizationId: "org_a",
        orgRole: "member",
        status: "active",
        organization: {
          id: "org_a",
          name: "A",
          slug: "a",
          kind: "personal",
          publicId: "ORG-A",
        },
      },
    ],
    ...overrides,
  };
}

describe("withdrawal privilege escalation (RBAC)", () => {
  it("denies withdrawals.approve for worker", () => {
    const decision = can(actor("w1"), "withdrawals.approve", {
      platformRoles: ["worker"],
    });
    expect(decision.allowed).toBe(false);
  });

  it("allows withdrawals.approve for finance", () => {
    expect(() =>
      assertCan(actor("f1"), "withdrawals.approve", {
        platformRoles: ["finance"],
      }),
    ).not.toThrow();
  });

  it("allows withdrawals.request for worker", () => {
    expect(() =>
      assertCan(actor("w1"), "withdrawals.request", {
        platformRoles: ["worker"],
      }),
    ).not.toThrow();
  });
});

describe("IDOR resource guards", () => {
  it("blocks cross-user submission access", () => {
    expect(() =>
      assertSubmissionAccess({
        workerUserId: "owner",
        actorUserId: "intruder",
      }),
    ).toThrow(AppError);
  });

  it("allows reviewer staff to read submissions", () => {
    expect(() =>
      assertSubmissionAccess({
        workerUserId: "owner",
        actorUserId: "rev",
        allowReviewer: true,
        platformRoles: ["reviewer"],
      }),
    ).not.toThrow();
  });

  it("blocks cross-org campaign access", () => {
    expect(() =>
      assertCampaignAccess({
        user: sessionUser({ id: "user_b", memberships: [] }),
        organizationId: "org_a",
        clientUserId: "user_a",
      }),
    ).toThrow(AppError);
  });

  it("allows org member campaign access", () => {
    expect(() =>
      assertCampaignAccess({
        user: sessionUser(),
        organizationId: "org_a",
        clientUserId: "someone_else",
      }),
    ).not.toThrow();
  });

  it("blocks cross-user payment intent access", () => {
    expect(() =>
      assertPaymentIntentAccess({
        user: sessionUser({ id: "intruder", memberships: [] }),
        clientUserId: "owner",
        organizationId: "org_other",
      }),
    ).toThrow(AppError);
  });

  it("blocks cross-user wallet access", () => {
    expect(() =>
      assertWalletAccess({
        user: sessionUser({ id: "intruder", memberships: [] }),
        ownerUserId: "owner",
        organizationId: null,
      }),
    ).toThrow(AppError);
  });
});

describe("webhook spoofing protection", () => {
  const secret = "test-webhook-secret-phase3a3";

  it("rejects unsigned payloads even with stub:true", async () => {
    process.env.WEBHOOK_SIGNING_SECRET = secret;
    const body = JSON.stringify({
      stub: true,
      type: "payment.succeeded",
      providerRef: "spoof_1",
      amountMinor: 100,
      currency: "NGN",
    });
    const parsed = await memoryPaymentAdapter.parseWebhook({}, body);
    expect(parsed.validSignature).toBe(false);
  });

  it("rejects wrong signature", () => {
    process.env.WEBHOOK_SIGNING_SECRET = secret;
    const body = JSON.stringify({ type: "payment.succeeded", providerRef: "x" });
    const headers = buildSignedWebhookHeaders({
      body,
      secret: "wrong-secret",
      eventId: "evt_wrong",
    });
    expect(() =>
      verifyWebhookRequest({ provider: "paystack", headers, body }),
    ).toThrow(AppError);
  });

  it("accepts valid HMAC + timestamp + event id", () => {
    process.env.WEBHOOK_SIGNING_SECRET = secret;
    const body = JSON.stringify({
      type: "payment.succeeded",
      providerRef: "ok_1",
      amountMinor: 5000,
      currency: "NGN",
    });
    const headers = buildSignedWebhookHeaders({
      body,
      secret,
      eventId: "evt_ok_1",
    });
    const result = verifyWebhookRequest({
      provider: "paystack",
      headers,
      body,
    });
    expect(result.ok).toBe(true);
  });

  it("supports secret rotation (previous secret still valid)", () => {
    process.env.WEBHOOK_SIGNING_SECRET = "current-secret";
    process.env.WEBHOOK_SIGNING_SECRETS = "previous-secret";
    const body = "{}";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signWebhookBody({
      body,
      timestamp,
      secret: "previous-secret",
    });
    const result = verifyWebhookRequest({
      provider: "resend",
      headers: {
        "x-webhook-signature": signature,
        "x-webhook-timestamp": String(timestamp),
        "x-webhook-id": "evt_rot_1",
      },
      body,
    });
    expect(result.matchedSecretIndex).toBe(1);
  });

  it("rejects replayed event ids", () => {
    process.env.WEBHOOK_SIGNING_SECRET = secret;
    const body = "{}";
    const headers = buildSignedWebhookHeaders({
      body,
      secret,
      eventId: "evt_replay",
    });
    verifyWebhookRequest({ provider: "sendchamp", headers, body });
    try {
      verifyWebhookRequest({ provider: "sendchamp", headers, body });
      expect.fail("expected replay rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("WEBHOOK_REPLAY");
    }
  });

  it("rejects stale timestamps", () => {
    process.env.WEBHOOK_SIGNING_SECRET = secret;
    const body = "{}";
    const stale = Math.floor(Date.now() / 1000) - 10_000;
    const signature = signWebhookBody({
      body,
      timestamp: stale,
      secret,
    });
    expect(() =>
      verifyWebhookRequest({
        provider: "paystack",
        headers: {
          "x-webhook-signature": signature,
          "x-webhook-timestamp": String(stale),
          "x-webhook-id": "evt_stale",
        },
        body,
      }),
    ).toThrow(AppError);
  });

  it("parses signed stub adapter webhooks", async () => {
    process.env.WEBHOOK_SIGNING_SECRET = secret;
    const body = JSON.stringify({
      type: "payment.succeeded",
      providerRef: "mem_ref_signed",
      amountMinor: 5000,
      currency: "NGN",
      paymentPublicId: "PAY-6N2K8M",
    });
    const headers = buildSignedWebhookHeaders({
      body,
      secret,
      eventId: "evt_mem_1",
    });
    const parsed = await memoryPaymentAdapter.parseWebhook(headers, body);
    expect(parsed.validSignature).toBe(true);
    expect(parsed.events[0]?.type).toBe("payment.succeeded");
  });
});

describe("reservation atomic release contract", () => {
  it("exports forceReleaseReservation for ops ARCH-1 path", { timeout: 20_000 }, async () => {
    const mod = await import(
      "@/features/task-marketplace/services/reservation-engine"
    );
    expect(typeof mod.forceReleaseReservation).toBe("function");
    expect(typeof mod.releaseReservation).toBe("function");
    expect(typeof mod.reserveTaskInstance).toBe("function");
  });
});
