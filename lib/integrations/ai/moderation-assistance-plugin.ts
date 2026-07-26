import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const moderationAssistancePlugin = createStubPlugin({
  key: "moderation_assistance",
  displayName: "Moderation Assistance",
  capabilities: ["moderation_assistance"],
  supportedEntityTypes: ["user", "submission"],
  supportedExtensionPoints: ["operations", "review"],
  priority: 70,
});
