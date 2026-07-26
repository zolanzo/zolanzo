import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const evidenceQualityPlugin = createStubPlugin({
  key: "evidence_quality",
  displayName: "Evidence Quality",
  capabilities: ["evidence_quality"],
  supportedEntityTypes: ["submission"],
  supportedExtensionPoints: ["submission", "validation", "review"],
  priority: 10,
});
