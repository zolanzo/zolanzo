/**
 * BusinessContextBuilder — freeze retrieved knowledge + conversation for response gen.
 */

import type { CopilotMessage } from "@/lib/ai/types";
import type { OrgCopilotIntent, OrgKnowledgeFacts } from "@/lib/ai/copilot/org-types";
import type { RetrievedKnowledge } from "@/lib/ai/copilot/knowledge-retriever";

export type OrgBusinessContext = {
  organizationId: string;
  organizationName: string;
  intent: OrgCopilotIntent;
  question: string;
  isFollowUp: boolean;
  retrieved: RetrievedKnowledge;
  recentMessages: CopilotMessage[];
  currency: string;
  frozenAt: string;
};

export function buildOrgBusinessContext(params: {
  facts: OrgKnowledgeFacts;
  intent: OrgCopilotIntent;
  question: string;
  isFollowUp: boolean;
  retrieved: RetrievedKnowledge;
  recentMessages?: CopilotMessage[];
}): OrgBusinessContext {
  return {
    organizationId: params.facts.organizationId,
    organizationName: params.facts.organizationName,
    intent: params.intent,
    question: params.question,
    isFollowUp: params.isFollowUp,
    retrieved: params.retrieved,
    recentMessages: (params.recentMessages ?? []).slice(-6),
    currency: params.facts.currency,
    frozenAt: params.facts.frozenAt,
  };
}
