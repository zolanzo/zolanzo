import { createStubChannelAdapter } from "@/lib/integrations/notifications/stub-factory";

/** Resend email adapter — stub only. */
export const resendNotificationAdapter = createStubChannelAdapter({
  providerKey: "resend",
  channels: ["email"],
  capabilities: ["email", "templates"],
});
