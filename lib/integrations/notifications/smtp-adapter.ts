import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";

/** SMTP email adapter — stub only. */
export const smtpNotificationAdapter = createStubChannelAdapter({
  providerKey: "smtp",
  channels: ["email"],
  capabilities: ["email", "templates"],
});
