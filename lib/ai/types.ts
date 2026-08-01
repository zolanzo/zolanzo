/**
 * Phase 4.1A — AI Intelligence Foundation types.
 * AI is advisory only. Never mutates domain state.
 */

export const AI_LLM_PROVIDERS = ["mock", "openai"] as const;
export type AiLlmProviderKey = (typeof AI_LLM_PROVIDERS)[number];

export type AiStructuredJson = Record<string, unknown>;

export type AiInvokeRequest = {
  promptKey: string;
  variables?: Record<string, string>;
  systemPrompt?: string;
  /** When set, overrides registry template body */
  userPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  correlationId?: string | null;
  organizationId?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
};

export type AiTokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AiCostEstimate = {
  currency: "USD";
  /** Estimated USD micro-dollars (1e-6) for precision without floats in ledger */
  estimatedMicroUsd: number;
  model: string;
};

export type AiInvokeResult = {
  provider: AiLlmProviderKey;
  model: string;
  rawText: string;
  parsed: AiStructuredJson | null;
  usage: AiTokenUsage;
  cost: AiCostEstimate;
  latencyMs: number;
  correlationId: string | null;
  stub: boolean;
};

export type AiEmbeddingRequest = {
  input: string | string[];
  model?: string;
  timeoutMs?: number;
  correlationId?: string | null;
};

export type AiEmbeddingResult = {
  provider: AiLlmProviderKey;
  model: string;
  vectors: number[][];
  usage: AiTokenUsage;
  cost: AiCostEstimate;
  latencyMs: number;
  stub: boolean;
};

/** LLM completion port — domain never imports OpenAI SDK. */
export type IntelligenceLlmProvider = {
  readonly providerKey: AiLlmProviderKey;
  complete(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    correlationId?: string | null;
  }): Promise<{
    text: string;
    model: string;
    usage: AiTokenUsage;
    stub: boolean;
  }>;
};

export type EmbeddingProvider = {
  readonly providerKey: AiLlmProviderKey;
  embed(params: {
    input: string[];
    model?: string;
    timeoutMs?: number;
    correlationId?: string | null;
  }): Promise<{
    vectors: number[][];
    model: string;
    usage: AiTokenUsage;
    stub: boolean;
  }>;
};

/** Worker ranking — Phase 4.1B Match Engine. */
export type WorkerRankingInput = {
  campaignId: string;
  organizationId: string;
  candidateWorkerIds: string[];
  knowledgeSnapshot: AiStructuredJson;
};

export type WorkerRankingEntry = {
  workerId: string;
  matchScore: number;
  reasons: string[];
  confidence?: number;
  warnings?: string[];
  aiConfidence?: number | null;
  ruleScore?: number;
  label?: string;
};

export type WorkerRankingResult = {
  rankings: WorkerRankingEntry[];
  modelVersion: string;
  advisoryOnly: true;
};

export type RankingEngine = {
  rankWorkers(input: WorkerRankingInput): Promise<WorkerRankingResult>;
};

/** Fraud detection — Phase 4.1C advisory risk engine. */
export type FraudDetectionInput = {
  submissionId: string;
  organizationId: string | null;
  knowledgeSnapshot: AiStructuredJson;
};

export type FraudDetectionResult = {
  riskScore: number;
  findings: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
  advisoryOnly: true;
  riskLevel?: string;
  confidence?: number;
  reasons?: string[];
  warnings?: string[];
  suggestedActions?: string[];
};

export type FraudDetector = {
  assess(input: FraudDetectionInput): Promise<FraudDetectionResult>;
};

/** Review assistant — Phase 4.1D advisory reviewer workspace. */
export type ReviewAssistantInput = {
  submissionId: string;
  knowledgeSnapshot: AiStructuredJson;
};

export type ReviewAssistantResult = {
  summary: string;
  confidence: number;
  recommendation: "approve" | "reject" | "request_revision" | "escalate";
  findings: string[];
  advisoryOnly: true;
  warnings?: string[];
  missingItems?: string[];
  suggestedActions?: string[];
  alternativeAction?: string | null;
  checklist?: unknown[];
  campaignRuleChecks?: unknown[];
};

export type ReviewAssistant = {
  assist(input: ReviewAssistantInput): Promise<ReviewAssistantResult>;
};

/** Organization / worker copilots — advisory Q&A (4.1E / 4.1F). */
export type CopilotMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type CopilotQuery = {
  organizationId: string;
  actorUserId: string;
  messages: CopilotMessage[];
  knowledgeSnapshot: AiStructuredJson;
};

export type CopilotAnswer = {
  answer: string;
  citations: string[];
  advisoryOnly: true;
  confidence?: number;
  keyFindings?: string[];
  recommendations?: unknown[];
  suggestedFollowUps?: string[];
  dataSources?: string[];
  intent?: string;
};

export type OrganizationCopilot = {
  ask(query: CopilotQuery): Promise<CopilotAnswer>;
};

export type WorkerCopilot = {
  ask(query: CopilotQuery & { workerUserId: string }): Promise<CopilotAnswer>;
};

export type KnowledgeSnapshotKind =
  | "campaign"
  | "organization"
  | "worker"
  | "submission"
  | "payment_summary"
  | "trust_summary";

export type KnowledgeSnapshot = {
  kind: KnowledgeSnapshotKind;
  subjectId: string;
  frozenAt: string;
  data: AiStructuredJson;
};
