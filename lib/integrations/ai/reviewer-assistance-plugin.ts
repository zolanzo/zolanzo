import { createStubPlugin } from "@/lib/integrations/ai/stub-factory";

export const reviewerAssistancePlugin = createStubPlugin({
  key: "reviewer_assistance",
  displayName: "Reviewer Assistance",
  capabilities: ["reviewer_assistance"],
  supportedEntityTypes: ["review_queue_item", "submission"],
  supportedExtensionPoints: ["review"],
  priority: 50,
});
