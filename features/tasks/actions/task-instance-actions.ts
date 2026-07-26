"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type { TaskInstanceStatus } from "@/constants/work-states";
import type {
  GenerationPreview,
  InventoryAnalytics,
  TaskInstanceRecord,
} from "@/features/tasks/types";
import {
  generateTaskInstances,
  getCampaignInventory,
  getTaskInstanceByPublicId,
  listTaskInstances,
  previewTaskInstanceGeneration,
  transitionTaskInstance,
} from "@/features/tasks/services/task-instance-service";

export async function previewTaskGenerationAction(
  input: unknown,
): Promise<ApiResponse<GenerationPreview>> {
  await requireAuthContext();
  return previewTaskInstanceGeneration({ input });
}

export async function generateTaskInstancesAction(
  input: unknown,
): Promise<
  ApiResponse<{
    created: number;
    instances: TaskInstanceRecord[];
    preview: GenerationPreview;
  }>
> {
  await requireAuthContext();
  return generateTaskInstances({ input });
}

export async function getCampaignInventoryAction(
  campaignId: string,
): Promise<ApiResponse<InventoryAnalytics>> {
  await requireAuthContext();
  return getCampaignInventory(campaignId);
}

export async function listTaskInstancesAction(params: {
  campaignId: string;
  status?: TaskInstanceStatus;
}): Promise<ApiResponse<TaskInstanceRecord[]>> {
  await requireAuthContext();
  const rows = await listTaskInstances(params);
  return { ok: true, data: rows };
}

export async function getTaskInstanceAction(
  publicId: string,
): Promise<ApiResponse<TaskInstanceRecord>> {
  await requireAuthContext();
  const row = await getTaskInstanceByPublicId(publicId);
  if (!row) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Task instance not found" },
    };
  }
  return { ok: true, data: row };
}

export async function transitionTaskInstanceAction(params: {
  id: string;
  to: TaskInstanceStatus;
}): Promise<ApiResponse<TaskInstanceRecord>> {
  await requireAuthContext();
  return transitionTaskInstance(params);
}
