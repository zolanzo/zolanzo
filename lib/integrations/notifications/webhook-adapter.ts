import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";

/** Outbound webhook notification adapter — stub only. */
export const webhookNotificationAdapter = createStubChannelAdapter({
  providerKey: "webhook",
  channels: ["webhook"],
  capabilities: ["webhook", "templates", "batch"],
});
