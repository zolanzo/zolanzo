import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";

/** In-app notification store adapter — stub only (memory delivers for tests). */
export const inAppNotificationAdapter = createStubChannelAdapter({
  providerKey: "in_app",
  channels: ["in_app"],
  capabilities: ["in_app", "templates", "priority"],
});
