/**
 * AI Decision Records — immutable audit of AI-assisted human decisions.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  AI_DECISION_OUTCOMES,
  AI_ENTITY_TYPES,
  AI_EXTENSION_POINTS,
  type AiDecisionOutcome,
} from "@/constants/ai";
import { z } from "zod";

export type AiDecisionRecordView = {
  id: string;
  publicId: string;
  finalDecision: string;
  outcome: AiDecisionOutcome;
  recommendationIds: string[];
  executionIds: string[];
};

export const createDecisionRecordSchema = z.object({
  entityType: z.enum(AI_ENTITY_TYPES),
  entityId: z.string().min(1),
  entityPublicId: z.string().min(1).optional().nullable(),
  organizationId: z.string().min(1).optional().nullable(),
  extensionPoint: z.enum(AI_EXTENSION_POINTS),
  finalDecision: z.string().min(1).max(200),
  outcome: z.enum(AI_DECISION_OUTCOMES),
  recommendationIds: z.array(z.string().min(1)).min(1),
  evidenceReferences: z.array(z.string()).optional(),
  rationale: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export async function createAiDecisionRecord(params: {
  input: unknown;
  actorUserId?: string | null;
}): Promise<ApiResponse<AiDecisionRecordView>> {
  try {
    const parsed = createDecisionRecordSchema.parse(params.input);

    const recommendations = await prisma.aiRecommendation.findMany({
      where: { id: { in: parsed.recommendationIds } },
      include: { execution: true },
    });

    if (recommendations.length !== parsed.recommendationIds.length) {
      throw new AppError(
        "RECOMMENDATION_NOT_FOUND",
        "One or more recommendations were not found",
        404,
      );
    }

    const publicId = await generatePublicId("ai_decision");

    const record = await prisma.$transaction(async (tx) => {
      const decision = await tx.aiDecisionRecord.create({
        data: {
          publicId,
          actorUserId: params.actorUserId ?? null,
          organizationId: parsed.organizationId ?? null,
          entityType: parsed.entityType,
          entityId: parsed.entityId,
          entityPublicId: parsed.entityPublicId ?? null,
          extensionPoint: parsed.extensionPoint,
          finalDecision: parsed.finalDecision,
          outcome: parsed.outcome,
          evidenceReferences: (parsed.evidenceReferences ??
            []) as Prisma.InputJsonValue,
          rationale: parsed.rationale ?? null,
          metadata: (parsed.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });

      for (const rec of recommendations) {
        await tx.aiDecisionRecommendation.create({
          data: {
            decisionId: decision.id,
            recommendationId: rec.id,
            executionId: rec.executionId,
          },
        });
      }

      return decision;
    });

    return apiSuccess({
      id: record.id,
      publicId: record.publicId,
      finalDecision: record.finalDecision,
      outcome: record.outcome as AiDecisionOutcome,
      recommendationIds: parsed.recommendationIds,
      executionIds: [
        ...new Set(recommendations.map((r) => r.executionId)),
      ],
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "AI_DECISION_FAILED",
      error instanceof Error ? error.message : "Could not create decision record",
    );
  }
}
