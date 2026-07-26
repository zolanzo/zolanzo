import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";
import { AI_ENTITY_TYPES, AI_EXTENSION_POINTS, AI_PLUGIN_CAPABILITIES } from "@/constants/ai";

/** In-process heuristic plugin for tests and local recommendation paths. */
export const memoryAiPlugin = createStubPlugin({
  key: "memory",
  displayName: "Memory Plugin",
  capabilities: AI_PLUGIN_CAPABILITIES,
  supportedEntityTypes: AI_ENTITY_TYPES,
  supportedExtensionPoints: AI_EXTENSION_POINTS,
  priority: 0,
  executeLive: true,
  defaultRecommendation: "assist",
});
