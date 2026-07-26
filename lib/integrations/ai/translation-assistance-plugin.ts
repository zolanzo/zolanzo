import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const translationAssistancePlugin = createStubPlugin({
  key: "translation_assistance",
  displayName: "Translation Assistance",
  capabilities: ["translation_assistance"],
  supportedEntityTypes: ["submission", "notification_intent"],
  supportedExtensionPoints: ["submission", "notifications"],
  priority: 80,
});
