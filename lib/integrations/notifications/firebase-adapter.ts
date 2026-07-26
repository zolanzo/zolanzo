import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";

/** Firebase Cloud Messaging adapter — stub only. */
export const firebaseNotificationAdapter = createStubChannelAdapter({
  providerKey: "firebase",
  channels: ["push"],
  capabilities: ["push", "templates", "priority"],
});
