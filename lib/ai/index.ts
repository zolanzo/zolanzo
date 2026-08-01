/**
 * AI Intelligence Foundation — public exports.
 *
 * Package layout maps Cursor task `src/ai/` → `lib/ai/` (repo convention).
 * AI is advisory only. Never mutates business data.
 */

export type {
  IntelligenceLlmProvider as AIProvider,
  EmbeddingProvider,
  RankingEngine,
  FraudDetector,
  ReviewAssistant,
  OrganizationCopilot,
  WorkerCopilot,
  AiInvokeRequest,
  AiInvokeResult,
  AiEmbeddingRequest,
  AiEmbeddingResult,
  KnowledgeSnapshot,
} from "@/lib/ai/types";

export {
  isAiEnabled,
  getAiProviderKey,
  aiRuntimeMode,
  shouldUseLiveOpenAi,
  getOpenAiApiKey,
  getOpenAiModel,
} from "@/lib/ai/config";

export { invokeIntelligence, hashSnapshot } from "@/lib/ai/engine";
export {
  getIntelligenceLlmProvider,
  createMockAiProvider,
  createOpenAiProvider,
} from "@/lib/ai/providers";
export { getEmbeddingProvider } from "@/lib/ai/embeddings";
export { getPrompt, listPromptKeys, renderPromptTemplate } from "@/lib/ai/prompts/registry";
export { parseStructuredJson } from "@/lib/ai/prompts/parser";
export { rankingEngine, rankingEngineStub } from "@/lib/ai/ranking";
export { fraudDetector, fraudDetectorStub } from "@/lib/ai/fraud";
export { reviewAssistant, reviewAssistantStub } from "@/lib/ai/review";
export {
  organizationCopilot,
  organizationCopilotStub,
  workerCopilot,
  workerCopilotStub,
} from "@/lib/ai/copilot";
export {
  getAiTelemetrySnapshot,
  listAiAudit,
  resetAiTelemetryForTests,
  resetAiAuditForTests,
} from "@/lib/ai/telemetry";
export {
  getRankingTelemetrySnapshot,
  resetRankingTelemetryForTests,
} from "@/lib/ai/ranking/ranking-telemetry";
export {
  getFraudTelemetrySnapshot,
  resetFraudTelemetryForTests,
} from "@/lib/ai/fraud/fraud-telemetry";
export {
  getReviewAssistantTelemetrySnapshot,
  resetReviewAssistantTelemetryForTests,
} from "@/lib/ai/review/review-telemetry";
export {
  getOrgCopilotTelemetrySnapshot,
  resetOrgCopilotTelemetryForTests,
} from "@/lib/ai/copilot/org-telemetry";
export {
  getWorkerCopilotTelemetrySnapshot,
  resetWorkerCopilotTelemetryForTests,
} from "@/lib/ai/copilot/worker-telemetry";
