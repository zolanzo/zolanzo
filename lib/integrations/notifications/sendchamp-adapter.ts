import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";

/** Sendchamp SMS adapter — stub only. */
export const sendchampNotificationAdapter = createStubChannelAdapter({
  providerKey: "sendchamp",
  channels: ["sms"],
  capabilities: ["sms", "templates"],
});
