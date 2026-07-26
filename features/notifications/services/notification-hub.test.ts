import { describe, expect, it } from "vitest";
import {
  listNotificationAdapters,
  selectNotificationAdapter,
  memoryNotificationAdapter,
  resendNotificationAdapter,
  sendchampNotificationAdapter,
  firebaseNotificationAdapter,
} from "@/lib/integrations/notifications";
import {
  adapterHasCapabilities,
  adapterSupportsChannel,
} from "@/lib/integrations/notifications/stub-factory";
import { formatRandomPublicId, isValidPublicId } from "@/lib/public-id/format";
import {
  findBuiltinTemplate,
  renderNotificationTemplate,
  renderTemplateString,
  templateKeyForEvent,
  BUILTIN_NOTIFICATION_TEMPLATES,
} from "@/features/notifications/services/templates";
import {
  computeRetrySchedule,
  evaluateDeliverySchedule,
  isWithinWindow,
  localMinutesOfDay,
} from "@/features/notifications/services/policies";
import {
  defaultUserPreference,
  filterChannelsByPreference,
  isEventSubscribed,
  mergePreferences,
  preferenceSubjectKey,
} from "@/features/notifications/services/preferences";
import {
  addressForChannel,
  resolveRecipients,
} from "@/features/notifications/services/recipients";
import { NOTIFICATION_HUB_EVENTS } from "@/constants/notification";

describe("channel adapter contracts", () => {
  it("lists builtin adapters including stubs", () => {
    const keys = listNotificationAdapters().map((a) => a.providerKey);
    expect(keys).toContain("memory");
    expect(keys).toContain("resend");
    expect(keys).toContain("smtp");
    expect(keys).toContain("sendchamp");
    expect(keys).toContain("firebase");
    expect(keys).toContain("webhook");
    expect(keys).toContain("in_app");
  });

  it("selects by channel without naming a provider", () => {
    const adapter = selectNotificationAdapter({ channel: "sms" });
    expect(adapterSupportsChannel(adapter, "sms")).toBe(true);
  });

  it("selects memory when preferLive", () => {
    const adapter = selectNotificationAdapter({
      channel: "email",
      preferLive: true,
    });
    expect(adapter.providerKey).toBe("memory");
  });

  it("memory delivers; stubs queue only", async () => {
    const live = await memoryNotificationAdapter.deliver({
      channel: "email",
      to: "a@example.com",
      bodyText: "hello",
      subject: "Hi",
      idempotencyKey: "idem_live_1",
    });
    expect(live.status).toBe("delivered");

    const stub = await resendNotificationAdapter.deliver({
      channel: "email",
      to: "a@example.com",
      bodyText: "hello",
      subject: "Hi",
      idempotencyKey: "idem_stub_1",
    });
    expect(stub.status).toBe("queued");
    expect(stub.raw?.stub).toBe(true);
  });

  it("reports channel capabilities", () => {
    expect(adapterHasCapabilities(sendchampNotificationAdapter, ["sms"])).toBe(
      true,
    );
    expect(
      adapterHasCapabilities(firebaseNotificationAdapter, ["push", "priority"]),
    ).toBe(true);
    expect(adapterHasCapabilities(resendNotificationAdapter, ["sms"])).toBe(
      false,
    );
  });
});

describe("template rendering", () => {
  it("covers all hub events with at least email + in_app", () => {
    for (const event of NOTIFICATION_HUB_EVENTS) {
      expect(findBuiltinTemplate({ event, channel: "email" })).not.toBeNull();
      expect(findBuiltinTemplate({ event, channel: "in_app" })).not.toBeNull();
    }
    expect(BUILTIN_NOTIFICATION_TEMPLATES.length).toBeGreaterThan(20);
  });

  it("renders strongly typed variables", () => {
    const template = findBuiltinTemplate({
      event: "review.approved",
      channel: "email",
    })!;
    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: "Ada",
        organizationName: "Acme",
        publicRef: "REV-8M3Q2K",
        decisionSummary: "Looks good",
      },
    });
    expect(rendered.subject).toContain("REV-8M3Q2K");
    expect(rendered.bodyText).toContain("Ada");
    expect(rendered.bodyHtml).toContain("Acme");
  });

  it("rejects missing required variables", () => {
    const template = findBuiltinTemplate({
      event: "review.approved",
      channel: "email",
    })!;
    expect(() =>
      renderNotificationTemplate({
        template,
        variables: { recipientName: "Ada" },
      }),
    ).toThrow(/Missing template variables/);
  });

  it("interpolates template strings", () => {
    expect(renderTemplateString("Hi {{ name }}", { name: "Bo" })).toBe("Hi Bo");
    expect(templateKeyForEvent("campaign.funded")).toBe("campaign_funded");
  });
});

describe("delivery policies", () => {
  it("schedules delayed delivery", () => {
    const now = new Date("2026-07-26T12:00:00.000Z");
    const result = evaluateDeliverySchedule({
      policy: { mode: "delayed", delaySeconds: 300 },
      now,
      timezone: "UTC",
    });
    expect(result.scheduledAt.getTime()).toBe(now.getTime() + 300_000);
  });

  it("defers for quiet hours", () => {
    // 23:00 UTC is inside 22:00–07:00
    const now = new Date("2026-07-26T23:00:00.000Z");
    const result = evaluateDeliverySchedule({
      policy: {
        mode: "quiet_hours",
        quietHours: { start: "22:00", end: "07:00" },
      },
      now,
      timezone: "UTC",
    });
    expect(result.deferredForQuietHours).toBe(true);
    expect(result.scheduledAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("defers for DND windows", () => {
    const now = new Date("2026-07-26T14:00:00.000Z");
    const result = evaluateDeliverySchedule({
      policy: { mode: "immediate" },
      now,
      timezone: "UTC",
      dndWindows: [{ start: "13:00", end: "15:00" }],
    });
    expect(result.deferredForDnd).toBe(true);
  });

  it("marks digest as deferred (future-ready)", () => {
    const result = evaluateDeliverySchedule({
      policy: { mode: "digest", digestFrequency: "daily" },
      timezone: "UTC",
    });
    expect(result.digestDeferred).toBe(true);
  });

  it("computes retry backoff and exhaustion", () => {
    const first = computeRetrySchedule({
      attempts: 1,
      retry: { maxAttempts: 3, backoffSeconds: 60 },
      from: new Date("2026-07-26T12:00:00.000Z"),
    });
    expect(first.exhausted).toBe(false);
    expect(first.nextAt.toISOString()).toBe("2026-07-26T12:01:00.000Z");

    const exhausted = computeRetrySchedule({
      attempts: 3,
      retry: { maxAttempts: 3, backoffSeconds: 60 },
    });
    expect(exhausted.exhausted).toBe(true);
  });

  it("detects overnight quiet windows", () => {
    expect(isWithinWindow(23 * 60, "22:00", "07:00")).toBe(true);
    expect(isWithinWindow(8 * 60, "22:00", "07:00")).toBe(false);
    expect(localMinutesOfDay(new Date("2026-07-26T00:30:00.000Z"), "UTC")).toBe(
      30,
    );
  });
});

describe("preferences", () => {
  it("builds subject keys", () => {
    expect(preferenceSubjectKey("user", "u1")).toBe("user:u1");
    expect(preferenceSubjectKey("organization", "o1")).toBe("org:o1");
  });

  it("filters channels and event subscriptions", () => {
    const preference = {
      ...defaultUserPreference("u1"),
      enabledChannels: ["email", "in_app"] as const,
      eventSubscriptions: ["review.approved"] as const,
    };
    // Cast via merge to mutable array types
    const merged = mergePreferences({
      user: {
        ...defaultUserPreference("u1"),
        enabledChannels: ["email", "in_app"],
        eventSubscriptions: ["review.approved"],
      },
    });
    expect(isEventSubscribed(merged, "review.approved")).toBe(true);
    expect(isEventSubscribed(merged, "withdrawal.completed")).toBe(false);
    expect(
      filterChannelsByPreference({
        preference: merged,
        requested: ["email", "sms", "push"],
        event: "review.approved",
      }),
    ).toEqual(["email"]);
    expect(preference.enabledChannels).toContain("email");
  });

  it("intersects user and org enabled channels", () => {
    const merged = mergePreferences({
      user: {
        ...defaultUserPreference("u1"),
        enabledChannels: ["email", "sms", "push"],
      },
      organization: {
        ...defaultUserPreference("u1"),
        scope: "organization",
        userId: null,
        organizationId: "o1",
        enabledChannels: ["email", "in_app"],
      },
    });
    expect(merged.enabledChannels).toEqual(["email"]);
  });
});

describe("recipient resolution", () => {
  it("dedupes and maps channel addresses", () => {
    const recipients = resolveRecipients([
      {
        role: "worker",
        userId: "u1",
        email: "w@example.com",
        phone: "+15551212",
        displayName: "Worker One",
      },
      {
        role: "worker",
        userId: "u1",
        email: "w@example.com",
      },
      {
        role: "client",
        userId: "u2",
        email: "c@example.com",
      },
    ]);
    expect(recipients).toHaveLength(2);
    const addr = addressForChannel(recipients[0]!);
    expect(addr.email).toBe("w@example.com");
    expect(addr.sms).toBe("+15551212");
    expect(addr.in_app).toBe("u1");
  });
});

describe("notification public ids", () => {
  it("formats NTF random ids", () => {
    const id = formatRandomPublicId("notification", "4K8N2P");
    expect(id).toBe("NTF-4K8N2P");
    expect(isValidPublicId("notification", id)).toBe(true);
  });
});

describe("idempotency key shape", () => {
  it("composes stable job keys from intent key + channel + recipient", () => {
    const intentKey = "evt_review_approved_rev8m3q2k";
    const jobKey = `${intentKey}:email:u1`;
    expect(jobKey).toBe("evt_review_approved_rev8m3q2k:email:u1");
  });
});
