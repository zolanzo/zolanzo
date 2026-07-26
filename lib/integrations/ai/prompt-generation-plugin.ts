import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const promptGenerationPlugin = createStubPlugin({
  key: "prompt_generation",
  displayName: "Prompt Generation",
  capabilities: ["prompt_generation"],
  supportedEntityTypes: ["submission", "review_queue_item"],
  supportedExtensionPoints: ["validation", "review"],
  priority: 90,
});
