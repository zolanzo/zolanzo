import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const riskScoringPlugin = createStubPlugin({
  key: "risk_scoring",
  displayName: "Risk Scoring",
  capabilities: ["risk_scoring"],
  supportedEntityTypes: ["submission", "withdrawal", "user"],
  supportedExtensionPoints: ["review", "withdrawal", "operations"],
  priority: 40,
});
