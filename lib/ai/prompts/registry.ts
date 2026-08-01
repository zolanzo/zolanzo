/**
 * Prompt registry — versioned templates with {{variable}} slots.
 */

export type PromptDefinition = {
  key: string;
  version: string;
  system: string;
  user: string;
  /** Expected JSON schema description (documentation / parser hints) */
  outputSchemaHint: string;
};

const REGISTRY: Record<string, PromptDefinition> = {
  "health.ping": {
    key: "health.ping",
    version: "1.0.0",
    system: "You are a ZOLANZO AI health probe. Reply with JSON only.",
    user: 'Return {"ok":true,"message":"pong","provider":"{{provider}}"}.',
    outputSchemaHint: '{ "ok": boolean, "message": string, "provider": string }',
  },
  "ranking.workers.stub": {
    key: "ranking.workers.stub",
    version: "0.1.0",
    system:
      "You are a ZOLANZO ranking advisor. Never invent workers. JSON only. Advisory.",
    user: "Campaign {{campaignId}}. Candidates: {{candidateIds}}. Return ranking JSON.",
    outputSchemaHint:
      '{ "rankings": [{ "workerId": string, "matchScore": number, "reasons": string[] }] }',
  },
  "fraud.assess.stub": {
    key: "fraud.assess.stub",
    version: "0.1.0",
    system:
      "You are a ZOLANZO fraud advisor. JSON only. Do not approve money movement.",
    user: "Assess submission {{submissionId}} risk from snapshot {{snapshot}}.",
    outputSchemaHint:
      '{ "riskScore": number, "findings": [{ "code": string, "severity": string, "message": string }] }',
  },
  "review.assist.stub": {
    key: "review.assist.stub",
    version: "0.1.0",
    system:
      "You are a ZOLANZO review assistant. Recommend only. Humans decide. JSON only.",
    user: "Summarize submission {{submissionId}} for a reviewer: {{snapshot}}.",
    outputSchemaHint:
      '{ "summary": string, "confidence": number, "recommendation": string, "findings": string[] }',
  },
  "copilot.org.stub": {
    key: "copilot.org.stub",
    version: "0.1.0",
    system:
      "You are the ZOLANZO organization copilot. Answer from provided knowledge only. JSON only.",
    user: "Question: {{question}}. Knowledge: {{knowledge}}.",
    outputSchemaHint: '{ "answer": string, "citations": string[] }',
  },
};

export function getPrompt(key: string): PromptDefinition | null {
  return REGISTRY[key] ?? null;
}

export function listPromptKeys(): string[] {
  return Object.keys(REGISTRY).sort();
}

export function renderPromptTemplate(
  template: string,
  variables: Record<string, string> = {},
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    return variables[name] ?? "";
  });
}
