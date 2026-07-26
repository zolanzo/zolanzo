import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const fraudDetectionPlugin = createStubPlugin({
  key: "fraud_detection",
  displayName: "Fraud Detection",
  capabilities: ["fraud_detection"],
  supportedEntityTypes: ["submission", "user"],
  supportedExtensionPoints: ["submission", "validation", "review", "operations"],
  priority: 20,
});
