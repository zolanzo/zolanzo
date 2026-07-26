import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";

/** In-process delivery for tests and local dispatch. */
export const memoryNotificationAdapter = createStubChannelAdapter({
  providerKey: "memory",
  channels: ["email", "sms", "push", "in_app", "webhook"],
  capabilities: [
    "email",
    "sms",
    "push",
    "in_app",
    "webhook",
    "templates",
    "batch",
    "priority",
  ],
  deliverLive: true,
});
