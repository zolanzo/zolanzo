/**
 * Worker Copilot runtime flags.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

export function isWorkerCopilotEnabled(): boolean {
  if (falsy(process.env.AI_WORKER_COPILOT)) return false;
  if (truthy(process.env.AI_WORKER_COPILOT)) return true;
  return true;
}

export function isWorkerMemoryEnabled(): boolean {
  if (falsy(process.env.AI_WORKER_MEMORY)) return false;
  if (truthy(process.env.AI_WORKER_MEMORY)) return true;
  return true;
}

export function isWorkerRecommendationsEnabled(): boolean {
  if (falsy(process.env.AI_WORKER_RECOMMENDATIONS)) return false;
  if (truthy(process.env.AI_WORKER_RECOMMENDATIONS)) return true;
  return true;
}

export function shouldAugmentWorkerCopilotWithAi(): boolean {
  const raw = process.env.AI_ENABLED?.trim().toLowerCase();
  const aiOn =
    raw === "1" || raw === "true" || raw === "on" || raw === "yes";
  return aiOn && isWorkerCopilotEnabled();
}

export { WORKER_COPILOT_MODEL_VERSION } from "@/lib/ai/copilot/worker-types";
