import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const duplicateDetectionPlugin = createStubPlugin({
  key: "duplicate_detection",
  displayName: "Duplicate Detection",
  capabilities: ["duplicate_detection"],
  supportedEntityTypes: ["submission"],
  supportedExtensionPoints: ["submission", "validation"],
  priority: 30,
});
