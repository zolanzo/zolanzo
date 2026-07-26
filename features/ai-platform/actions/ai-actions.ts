"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requirePermission } from "@/lib/rbac/guards";
import {
  listRegisteredPlugins,
  runAiPlugin,
  upsertAiConfiguration,
  type AiExecutionRecord,
} from "@/features/ai-platform/services/ai-platform";
import {
  createAiDecisionRecord,
  type AiDecisionRecordView,
} from "@/features/ai-platform/services/decisions";
import type { AiPluginResult } from "@/lib/integrations/types";

export async function listAiPluginsAction(): Promise<
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
  await requirePermission("ai.plugins.read");
  return listRegisteredPlugins();
}

export async function runAiPluginAction(
  input: unknown,
): Promise<ApiResponse<AiExecutionRecord & { result: AiPluginResult | null }>> {
  const ctx = await requirePermission("ai.plugins.execute");
  return runAiPlugin({ input, actorUserId: ctx.user.id });
}

export async function upsertAiConfigurationAction(
  input: unknown,
): Promise<ApiResponse<{ subjectKey: string; policyMode: string }>> {
  await requirePermission("ai.config.manage");
  return upsertAiConfiguration({ input });
}

export async function createAiDecisionRecordAction(
  input: unknown,
): Promise<ApiResponse<AiDecisionRecordView>> {
  const ctx = await requirePermission("ai.decisions.write");
  return createAiDecisionRecord({
    input,
    actorUserId: ctx.user.id,
  });
}
