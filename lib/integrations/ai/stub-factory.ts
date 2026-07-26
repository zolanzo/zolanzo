/**
 * Shared helpers for AI plugin stubs (no live LLM calls).
 */

import type {
  AiContext,
  AiPluginAdapter,
  AiPluginCapability,
  AiPluginMetadata,
  AiPluginResult,
  AiRecommendationKind,
  AiEntityType,
  AiExtensionPoint,
} from "@/lib/integrations/types";

export function createStubPlugin(params: {
  key: string;
  displayName: string;
  capabilities: readonly AiPluginCapability[];
  supportedEntityTypes: readonly AiEntityType[];
  supportedExtensionPoints: readonly AiExtensionPoint[];
  priority?: number;
  /** Only memory executes a real in-process analysis */
  executeLive?: boolean;
  defaultRecommendation?: AiRecommendationKind;
}): AiPluginAdapter {
  const {
    key,
    displayName,
    capabilities,
    supportedEntityTypes,
    supportedExtensionPoints,
    priority = 100,
    executeLive = false,
    defaultRecommendation = "score",
  } = params;

  const metadata: AiPluginMetadata = {
    key,
    displayName,
    version: executeLive ? "1.0.0" : "0.1.0-stub",
    capabilities,
    supportedEntityTypes,
    supportedExtensionPoints,
    priority,
    health: executeLive ? "healthy" : "stub",
    configurationSchema: { type: "object", properties: {} },
  };

  return {
    metadata,

    async execute(context: AiContext): Promise<AiPluginResult> {
      const started = Date.now();

      if (!executeLive) {
        return {
          pluginId: key,
          pluginKey: key,
          model: `${key}-stub`,
          modelVersion: metadata.version,
          confidence: 0,
          score: null,
          recommendation: "noop",
          findings: [
            {
              code: "STUB_ONLY",
              severity: "info",
              message: `Plugin ${key} is a stub — live model execution deferred`,
            },
          ],
          evidenceReferences: [],
          executionDurationMs: Date.now() - started,
          metadata: {
            stub: true,
            extensionPoint: context.extensionPoint,
            entityType: context.entityType,
          },
        };
      }

      const evidenceCount = Array.isArray(
        context.evidenceSnapshot?.items,
      )
        ? (context.evidenceSnapshot.items as unknown[]).length
        : 0;

      const score =
        typeof context.promptVariables.seedScore === "string"
          ? Number(context.promptVariables.seedScore)
          : Math.min(1, 0.55 + evidenceCount * 0.1);

      const confidence = Math.min(1, 0.5 + evidenceCount * 0.15);

      return {
        pluginId: key,
        pluginKey: key,
        model: "memory-heuristic",
        modelVersion: metadata.version,
        confidence,
        score,
        recommendation: defaultRecommendation,
        findings: [
          {
            code: "MEMORY_ANALYSIS",
            severity: score >= 0.7 ? "info" : "medium",
            message: `Memory plugin scored entity ${context.entityPublicId ?? context.entityId}`,
            evidenceRefs: evidenceCount
              ? [`evidence_count:${evidenceCount}`]
              : [],
          },
        ],
        evidenceReferences: evidenceCount
          ? [`evidence_count:${evidenceCount}`]
          : [],
        executionDurationMs: Date.now() - started,
        metadata: {
          memory: true,
          extensionPoint: context.extensionPoint,
          capabilities: [...capabilities],
        },
      };
    },
  };
}

export function pluginHasCapabilities(
  plugin: AiPluginAdapter,
  required: readonly AiPluginCapability[],
): boolean {
  const set = new Set(plugin.metadata.capabilities);
  return required.every((c) => set.has(c));
}

export function pluginSupports(
  plugin: AiPluginAdapter,
  params: {
    extensionPoint?: AiExtensionPoint;
    entityType?: AiEntityType;
  },
): boolean {
  if (
    params.extensionPoint &&
    !plugin.metadata.supportedExtensionPoints.includes(params.extensionPoint)
  ) {
    return false;
  }
  if (
    params.entityType &&
    !plugin.metadata.supportedEntityTypes.includes(params.entityType)
  ) {
    return false;
  }
  return true;
}
