/**
 * AI plugin registry — select by key or required capabilities.
 */

import type {
  AiEntityType,
  AiExtensionPoint,
  AiPluginAdapter,
  AiPluginCapability,
} from "@/lib/integrations/types";
import {
  pluginHasCapabilities,
  pluginSupports,
} from "@/lib/integrations/ai/stub-factory";
import { memoryAiPlugin } from "@/lib/integrations/ai/memory-plugin";
import { evidenceQualityPlugin } from "@/lib/integrations/ai/evidence-quality-plugin";
import { fraudDetectionPlugin } from "@/lib/integrations/ai/fraud-detection-plugin";
import { duplicateDetectionPlugin } from "@/lib/integrations/ai/duplicate-detection-plugin";
import { riskScoringPlugin } from "@/lib/integrations/ai/risk-scoring-plugin";
import { reviewerAssistancePlugin } from "@/lib/integrations/ai/reviewer-assistance-plugin";
import { queueRoutingPlugin } from "@/lib/integrations/ai/queue-routing-plugin";
import { moderationAssistancePlugin } from "@/lib/integrations/ai/moderation-assistance-plugin";
import { translationAssistancePlugin } from "@/lib/integrations/ai/translation-assistance-plugin";
import { promptGenerationPlugin } from "@/lib/integrations/ai/prompt-generation-plugin";
import { integrationRegistry } from "@/lib/integrations/registry";

const BUILTIN: AiPluginAdapter[] = [
  memoryAiPlugin,
  evidenceQualityPlugin,
  fraudDetectionPlugin,
  duplicateDetectionPlugin,
  riskScoringPlugin,
  reviewerAssistancePlugin,
  queueRoutingPlugin,
  moderationAssistancePlugin,
  translationAssistancePlugin,
  promptGenerationPlugin,
];

export function listAiPlugins(): AiPluginAdapter[] {
  const fromRegistry = integrationRegistry.aiPlugins ?? [];
  const keys = new Set(fromRegistry.map((p) => p.metadata.key));
  return [
    ...fromRegistry,
    ...BUILTIN.filter((p) => !keys.has(p.metadata.key)),
  ].sort((a, b) => a.metadata.priority - b.metadata.priority);
}

export function getAiPlugin(key: string): AiPluginAdapter | null {
  return listAiPlugins().find((p) => p.metadata.key === key) ?? null;
}

export function selectAiPlugin(params: {
  pluginKey?: string;
  requiredCapabilities?: readonly AiPluginCapability[];
  extensionPoint?: AiExtensionPoint;
  entityType?: AiEntityType;
  /** Prefer memory for local/test execution */
  preferLive?: boolean;
}): AiPluginAdapter {
  if (params.pluginKey) {
    const found = getAiPlugin(params.pluginKey);
    if (!found) {
      throw new Error(`Unknown AI plugin: ${params.pluginKey}`);
    }
    if (
      params.requiredCapabilities &&
      !pluginHasCapabilities(found, params.requiredCapabilities)
    ) {
      throw new Error(
        `Plugin ${params.pluginKey} missing required capabilities`,
      );
    }
    if (!pluginSupports(found, params)) {
      throw new Error(
        `Plugin ${params.pluginKey} does not support requested entity/extension`,
      );
    }
    return found;
  }

  let candidates = listAiPlugins().filter((p) => pluginSupports(p, params));

  if (params.requiredCapabilities?.length) {
    candidates = candidates.filter((p) =>
      pluginHasCapabilities(p, params.requiredCapabilities!),
    );
  }

  if (params.preferLive) {
    const live = candidates.find((p) => p.metadata.key === "memory");
    if (live) return live;
  }

  // Prefer non-memory stubs when capability matches, else memory
  const nonMemory = candidates.find((p) => p.metadata.key !== "memory");
  const match = nonMemory ?? candidates[0];
  if (!match) {
    throw new Error("No AI plugin matches required capabilities");
  }
  return match;
}

export {
  memoryAiPlugin,
  evidenceQualityPlugin,
  fraudDetectionPlugin,
  duplicateDetectionPlugin,
  riskScoringPlugin,
  reviewerAssistancePlugin,
  queueRoutingPlugin,
  moderationAssistancePlugin,
  translationAssistancePlugin,
  promptGenerationPlugin,
};
