import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const queueRoutingPlugin = createStubPlugin({
  key: "queue_routing",
  displayName: "Queue Routing",
  capabilities: ["queue_routing"],
  supportedEntityTypes: ["review_queue_item", "operational_command"],
  supportedExtensionPoints: ["review", "operations"],
  priority: 60,
});
