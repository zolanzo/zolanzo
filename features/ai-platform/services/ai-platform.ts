/**
 * AI Plugin Platform — registry execution, recommendations, never mutates domain.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  AI_ENTITY_TYPES,
  AI_EXTENSION_POINTS,
  AI_PLUGIN_CAPABILITIES,
  AI_POLICY_MODES,
  type AiPolicyMode,
} from "@/constants/ai";
import type {
  AiPluginCapability,
  AiPluginResult,
} from "@/lib/integrations/types";
import {
  listAiPlugins,
  selectAiPlugin,
} from "@/lib/integrations/ai";
import {
  buildAiContext,
  serializeAiContext,
  type BuildAiContextInput,
} from "@/features/ai-platform/services/context";
import {
  configurationSubjectKey,
  evaluateAiPolicy,
  isAiPolicyMode,
} from "@/features/ai-platform/services/policies";
import { z } from "zod";

export type AiExecutionRecord = {
  id: string;
  publicId: string;
  pluginKey: string;
  status: string;
  policyMode: AiPolicyMode;
  recommendation: string | null;
  confidence: number | null;
  score: number | null;
  skipped: boolean;
};

export const runAiPluginSchema = z.object({
  extensionPoint: z.enum(AI_EXTENSION_POINTS),
  entityType: z.enum(AI_ENTITY_TYPES),
  entityId: z.string().min(1),
  entityPublicId: z.string().min(1).optional().nullable(),
  organizationId: z.string().min(1).optional().nullable(),
  pluginKey: z.string().min(1).optional(),
  requiredCapabilities: z.array(z.enum(AI_PLUGIN_CAPABILITIES)).optional(),
  policyModeOverride: z.enum(AI_POLICY_MODES).optional(),
  preferLive: z.boolean().optional(),
  idempotencyKey: z.string().min(8).max(128),
  context: z
    .object({
      versionSnapshots: z.record(z.string(), z.unknown()).optional(),
      submissionSnapshot: z.record(z.string(), z.unknown()).optional().nullable(),
      evidenceSnapshot: z.record(z.string(), z.unknown()).optional().nullable(),
      validationReport: z.record(z.string(), z.unknown()).optional().nullable(),
      reviewFindings: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
      executionContext: z.record(z.string(), z.unknown()).optional(),
      pluginConfiguration: z.record(z.string(), z.unknown()).optional(),
      promptVariables: z.record(z.string(), z.string()).optional(),
      pluginMetadata: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export const upsertAiConfigSchema = z.object({
  organizationId: z.string().min(1).optional().nullable(),
  extensionPoint: z.enum(AI_EXTENSION_POINTS),
  policyMode: z.enum(AI_POLICY_MODES),
  pluginKey: z.string().min(1).optional().nullable(),
  requiredCapabilities: z.array(z.enum(AI_PLUGIN_CAPABILITIES)).optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  active: z.boolean().optional(),
});

async function resolvePolicyMode(params: {
  organizationId?: string | null;
  extensionPoint: string;
  pluginKey?: string | null;
  override?: AiPolicyMode;
}): Promise<AiPolicyMode> {
  if (params.override) return params.override;

  const keys = [
    configurationSubjectKey({
      organizationId: params.organizationId,
      extensionPoint: params.extensionPoint,
      pluginKey: params.pluginKey,
    }),
    configurationSubjectKey({
      organizationId: params.organizationId,
      extensionPoint: params.extensionPoint,
    }),
    configurationSubjectKey({
      extensionPoint: params.extensionPoint,
      pluginKey: params.pluginKey,
    }),
    configurationSubjectKey({ extensionPoint: params.extensionPoint }),
  ];

  for (const subjectKey of keys) {
    const row = await prisma.aiConfiguration.findUnique({
      where: { subjectKey },
    });
    if (row?.active && isAiPolicyMode(row.policyMode)) {
      return row.policyMode;
    }
  }

  return "recommendation_only";
}

export async function listRegisteredPlugins(): Promise<
  ApiResponse<
    Array<{
      key: string;
      displayName: string;
      version: string;
      capabilities: readonly string[];
      priority: number;
      health: string;
    }>
  >
> {
  const plugins = listAiPlugins().map((p) => ({
    key: p.metadata.key,
    displayName: p.metadata.displayName,
    version: p.metadata.version,
    capabilities: p.metadata.capabilities,
    priority: p.metadata.priority,
    health: p.metadata.health,
  }));
  return apiSuccess(plugins);
}

export async function runAiPlugin(params: {
  input: unknown;
  actorUserId?: string | null;
}): Promise<ApiResponse<AiExecutionRecord & { result: AiPluginResult | null }>> {
  try {
    const parsed = runAiPluginSchema.parse(params.input);

    const existing = await prisma.aiExecution.findUnique({
      where: { idempotencyKey: parsed.idempotencyKey },
    });
    if (existing) {
      return apiSuccess({
        id: existing.id,
        publicId: existing.publicId,
        pluginKey: existing.pluginKey,
        status: existing.status,
        policyMode: existing.policyMode as AiPolicyMode,
        recommendation: existing.recommendation,
        confidence: existing.confidence,
        score: existing.score,
        skipped: existing.status === "skipped",
        result: (existing.result as AiPluginResult | null) ?? null,
      });
    }

    const required =
      (parsed.requiredCapabilities as AiPluginCapability[] | undefined) ??
      undefined;

    const plugin = selectAiPlugin({
      pluginKey: parsed.pluginKey,
      requiredCapabilities: required,
      extensionPoint: parsed.extensionPoint,
      entityType: parsed.entityType,
      preferLive: parsed.preferLive ?? true,
    });

    const policyMode = await resolvePolicyMode({
      organizationId: parsed.organizationId,
      extensionPoint: parsed.extensionPoint,
      pluginKey: plugin.metadata.key,
      override: parsed.policyModeOverride,
    });
    const policy = evaluateAiPolicy(policyMode);

    const contextInput: BuildAiContextInput = {
      extensionPoint: parsed.extensionPoint,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      entityPublicId: parsed.entityPublicId,
      organizationId: parsed.organizationId,
      versionSnapshots: parsed.context?.versionSnapshots,
      submissionSnapshot: parsed.context?.submissionSnapshot,
      evidenceSnapshot: parsed.context?.evidenceSnapshot,
      validationReport: parsed.context?.validationReport,
      reviewFindings: parsed.context?.reviewFindings,
      executionContext: parsed.context?.executionContext,
      pluginConfiguration: parsed.context?.pluginConfiguration,
      promptVariables: parsed.context?.promptVariables,
      pluginMetadata: {
        pluginKey: plugin.metadata.key,
        pluginVersion: plugin.metadata.version,
        ...(parsed.context?.pluginMetadata ?? {}),
      },
    };
    const context = buildAiContext(contextInput);
    const publicId = await generatePublicId("ai_execution");

    if (!policy.executePlugin) {
      const skipped = await prisma.aiExecution.create({
        data: {
          publicId,
          pluginKey: plugin.metadata.key,
          extensionPoint: parsed.extensionPoint,
          entityType: parsed.entityType,
          entityId: parsed.entityId,
          entityPublicId: parsed.entityPublicId ?? null,
          organizationId: parsed.organizationId ?? null,
          actorUserId: params.actorUserId ?? null,
          status: "skipped",
          policyMode,
          contextSnapshot: serializeAiContext(context) as Prisma.InputJsonValue,
          idempotencyKey: parsed.idempotencyKey,
          errorMessage: policy.reason,
          completedAt: new Date(),
        },
      });
      return apiSuccess({
        id: skipped.id,
        publicId: skipped.publicId,
        pluginKey: skipped.pluginKey,
        status: skipped.status,
        policyMode,
        recommendation: null,
        confidence: null,
        score: null,
        skipped: true,
        result: null,
      });
    }

    // Ensure catalog row exists for FK (seeded in migration; upsert for safety)
    await prisma.aiPlugin.upsert({
      where: { key: plugin.metadata.key },
      create: {
        key: plugin.metadata.key,
        displayName: plugin.metadata.displayName,
        version: plugin.metadata.version,
        capabilities: plugin.metadata.capabilities as unknown as Prisma.InputJsonValue,
        supportedEntityTypes:
          plugin.metadata.supportedEntityTypes as unknown as Prisma.InputJsonValue,
        supportedExtensionPoints:
          plugin.metadata.supportedExtensionPoints as unknown as Prisma.InputJsonValue,
        priority: plugin.metadata.priority,
        health: plugin.metadata.health,
        configurationSchema:
          plugin.metadata.configurationSchema as Prisma.InputJsonValue,
      },
      update: {
        version: plugin.metadata.version,
        health: plugin.metadata.health,
        priority: plugin.metadata.priority,
      },
    });

    const running = await prisma.aiExecution.create({
      data: {
        publicId,
        pluginKey: plugin.metadata.key,
        extensionPoint: parsed.extensionPoint,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        entityPublicId: parsed.entityPublicId ?? null,
        organizationId: parsed.organizationId ?? null,
        actorUserId: params.actorUserId ?? null,
        status: "running",
        policyMode,
        contextSnapshot: serializeAiContext(context) as Prisma.InputJsonValue,
        idempotencyKey: parsed.idempotencyKey,
      },
    });

    try {
      const result = await plugin.execute(context);

      const completed = await prisma.$transaction(async (tx) => {
        const updated = await tx.aiExecution.update({
          where: { id: running.id },
          data: {
            status: "succeeded",
            result: result as unknown as Prisma.InputJsonValue,
            model: result.model,
            modelVersion: result.modelVersion,
            confidence: result.confidence,
            score: result.score,
            recommendation: result.recommendation,
            durationMs: result.executionDurationMs,
            completedAt: new Date(),
          },
        });

        await tx.aiRecommendation.create({
          data: {
            executionId: updated.id,
            kind: result.recommendation,
            confidence: result.confidence,
            score: result.score,
            summary: result.findings[0]?.message ?? result.recommendation,
            findings: result.findings as unknown as Prisma.InputJsonValue,
            evidenceReferences:
              result.evidenceReferences as unknown as Prisma.InputJsonValue,
            metadata: {
              policyMode,
              requiresHumanApproval: policy.requiresHumanApproval,
              applyAutomatically: policy.applyAutomatically,
              ...result.metadata,
            } as Prisma.InputJsonValue,
          },
        });

        return updated;
      });

      return apiSuccess({
        id: completed.id,
        publicId: completed.publicId,
        pluginKey: completed.pluginKey,
        status: completed.status,
        policyMode,
        recommendation: completed.recommendation,
        confidence: completed.confidence,
        score: completed.score,
        skipped: false,
        result,
      });
    } catch (execError) {
      const failed = await prisma.aiExecution.update({
        where: { id: running.id },
        data: {
          status: "failed",
          errorMessage:
            execError instanceof Error ? execError.message : "plugin_failed",
          completedAt: new Date(),
        },
      });
      return apiSuccess({
        id: failed.id,
        publicId: failed.publicId,
        pluginKey: failed.pluginKey,
        status: failed.status,
        policyMode,
        recommendation: null,
        confidence: null,
        score: null,
        skipped: false,
        result: null,
      });
    }
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "AI_PLUGIN_FAILED",
      error instanceof Error ? error.message : "Could not run AI plugin",
    );
  }
}

export async function upsertAiConfiguration(params: {
  input: unknown;
}): Promise<ApiResponse<{ subjectKey: string; policyMode: string }>> {
  try {
    const parsed = upsertAiConfigSchema.parse(params.input);
    const subjectKey = configurationSubjectKey({
      organizationId: parsed.organizationId,
      extensionPoint: parsed.extensionPoint,
      pluginKey: parsed.pluginKey,
    });

    await prisma.aiConfiguration.upsert({
      where: { subjectKey },
      create: {
        subjectKey,
        organizationId: parsed.organizationId ?? null,
        extensionPoint: parsed.extensionPoint,
        policyMode: parsed.policyMode,
        pluginKey: parsed.pluginKey ?? null,
        requiredCapabilities: (parsed.requiredCapabilities ??
          undefined) as Prisma.InputJsonValue | undefined,
        config: (parsed.config ?? undefined) as Prisma.InputJsonValue | undefined,
        active: parsed.active ?? true,
      },
      update: {
        policyMode: parsed.policyMode,
        requiredCapabilities: (parsed.requiredCapabilities ??
          null) as Prisma.InputJsonValue | undefined,
        config: (parsed.config ?? null) as Prisma.InputJsonValue | undefined,
        active: parsed.active ?? true,
        pluginKey: parsed.pluginKey ?? null,
      },
    });

    return apiSuccess({ subjectKey, policyMode: parsed.policyMode });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "AI_CONFIG_FAILED",
      error instanceof Error ? error.message : "Could not upsert AI config",
    );
  }
}
