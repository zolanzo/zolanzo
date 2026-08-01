/**
 * Organization & Worker copilots.
 * Both are production advisory Q&A — never mutate domain data.
 */

import type {
  OrganizationCopilot,
  WorkerCopilot,
  CopilotQuery,
  CopilotAnswer,
} from "@/lib/ai/types";

export type { OrganizationCopilot, WorkerCopilot, CopilotQuery, CopilotAnswer };

export {
  organizationCopilot,
  organizationCopilotStub,
  askOrganizationCopilot,
  resetOrgCopilotSessionStateForTests,
} from "@/lib/ai/copilot/organization-copilot";

export {
  workerCopilot,
  workerCopilotStub,
  askWorkerCopilot,
  resetWorkerCopilotSessionStateForTests,
} from "@/lib/ai/copilot/worker-copilot";

export { resolveOrgCopilotIntent } from "@/lib/ai/copilot/intent-resolver";
export { resolveWorkerCopilotIntent } from "@/lib/ai/copilot/worker-intent-resolver";
export { retrieveOrgKnowledge } from "@/lib/ai/copilot/knowledge-retriever";
export { retrieveWorkerKnowledge } from "@/lib/ai/copilot/worker-knowledge-retriever";
export { buildOrgBusinessContext } from "@/lib/ai/copilot/business-context-builder";
export {
  buildAssignmentCoachLines,
} from "@/lib/ai/copilot/assignment-context-builder";
export { analyzeWorkerProgress } from "@/lib/ai/copilot/progress-analyzer";
export {
  buildOrgRecommendations,
  suggestedFollowUps,
} from "@/lib/ai/copilot/recommendation-builder";
export {
  buildWorkerRecommendations,
  workerSuggestedFollowUps,
} from "@/lib/ai/copilot/worker-recommendation-builder";
export {
  canAccessOrgCopilotIntent,
  filterFactsByPermission,
  requiredPermissionsForIntent,
} from "@/lib/ai/copilot/permission-filter";
export {
  canAccessWorkerCopilotIntent,
  requiredPermissionsForWorkerIntent,
} from "@/lib/ai/copilot/worker-permission-filter";
export {
  isOrgCopilotEnabled,
  isOrgMemoryEnabled,
  isOrgRecommendationsEnabled,
  shouldAugmentOrgCopilotWithAi,
  ORG_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/org-config";
export {
  isWorkerCopilotEnabled,
  isWorkerMemoryEnabled,
  isWorkerRecommendationsEnabled,
  shouldAugmentWorkerCopilotWithAi,
  WORKER_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/worker-config";
export {
  getOrgCopilotTelemetrySnapshot,
  resetOrgCopilotTelemetryForTests,
} from "@/lib/ai/copilot/org-telemetry";
export {
  getWorkerCopilotTelemetrySnapshot,
  resetWorkerCopilotTelemetryForTests,
} from "@/lib/ai/copilot/worker-telemetry";
export type {
  OrgCopilotIntent,
  OrgCopilotResponse,
  OrgKnowledgeFacts,
  OrgCopilotRecommendation,
} from "@/lib/ai/copilot/org-types";
export type {
  WorkerCopilotIntent,
  WorkerCopilotResponse,
  WorkerKnowledgeFacts,
  WorkerCopilotRecommendation,
} from "@/lib/ai/copilot/worker-types";
export type { OrgCopilotAuthContext } from "@/lib/ai/copilot/permission-filter";
export type { WorkerCopilotAuthContext } from "@/lib/ai/copilot/worker-permission-filter";

/** Advisory forecast snippets for copilots (never mutates domain). */
export { getForecastSnippetForCopilot } from "@/lib/analytics/forecast/copilot-bridge";

export class CopilotNotImplementedError extends Error {
  constructor(kind: "organization" | "worker") {
    super(
      kind === "worker"
        ? "WorkerCopilot is unavailable."
        : "OrganizationCopilot is unavailable.",
    );
    this.name = "CopilotNotImplementedError";
  }
}
