/**
 * AI Context builders — immutable snapshots for plugins.
 */

import type {
  AiContext,
  AiEntityType,
  AiExtensionPoint,
} from "@/lib/integrations/types";

export type BuildAiContextInput = {
  extensionPoint: AiExtensionPoint;
  entityType: AiEntityType;
  entityId: string;
  entityPublicId?: string | null;
  organizationId?: string | null;
  versionSnapshots?: Record<string, unknown>;
  submissionSnapshot?: Record<string, unknown> | null;
  evidenceSnapshot?: Record<string, unknown> | null;
  validationReport?: Record<string, unknown> | null;
  reviewFindings?: readonly Record<string, unknown>[] | null;
  executionContext?: Record<string, unknown>;
  pluginConfiguration?: Record<string, unknown>;
  promptVariables?: Record<string, string>;
  pluginMetadata?: Record<string, unknown>;
  contextId?: string;
  createdAt?: string;
};

export function buildAiContext(input: BuildAiContextInput): AiContext {
  return Object.freeze({
    contextId: input.contextId ?? `ctx_${input.entityType}_${input.entityId}`,
    extensionPoint: input.extensionPoint,
    entityType: input.entityType,
    entityId: input.entityId,
    entityPublicId: input.entityPublicId ?? null,
    organizationId: input.organizationId ?? null,
    versionSnapshots: Object.freeze({ ...(input.versionSnapshots ?? {}) }),
    submissionSnapshot: input.submissionSnapshot
      ? Object.freeze({ ...input.submissionSnapshot })
      : null,
    evidenceSnapshot: input.evidenceSnapshot
      ? Object.freeze({ ...input.evidenceSnapshot })
      : null,
    validationReport: input.validationReport
      ? Object.freeze({ ...input.validationReport })
      : null,
    reviewFindings: input.reviewFindings
      ? Object.freeze(input.reviewFindings.map((f) => Object.freeze({ ...f })))
      : null,
    executionContext: Object.freeze({ ...(input.executionContext ?? {}) }),
    pluginConfiguration: Object.freeze({
      ...(input.pluginConfiguration ?? {}),
    }),
    promptVariables: Object.freeze({ ...(input.promptVariables ?? {}) }),
    pluginMetadata: Object.freeze({ ...(input.pluginMetadata ?? {}) }),
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
}

export function serializeAiContext(context: AiContext): Record<string, unknown> {
  return {
    contextId: context.contextId,
    extensionPoint: context.extensionPoint,
    entityType: context.entityType,
    entityId: context.entityId,
    entityPublicId: context.entityPublicId,
    organizationId: context.organizationId,
    versionSnapshots: context.versionSnapshots,
    submissionSnapshot: context.submissionSnapshot,
    evidenceSnapshot: context.evidenceSnapshot,
    validationReport: context.validationReport,
    reviewFindings: context.reviewFindings,
    executionContext: context.executionContext,
    pluginConfiguration: context.pluginConfiguration,
    promptVariables: context.promptVariables,
    pluginMetadata: context.pluginMetadata,
    createdAt: context.createdAt,
  };
}
