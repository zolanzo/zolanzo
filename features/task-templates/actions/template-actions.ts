"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type { TaskTemplateRecord } from "@/features/task-templates/types";
import {
  archiveTemplate,
  createDraftTemplate,
  createNewTemplateVersion,
  getTemplateByPublicId,
  listTemplates,
  publishTemplate,
  updateDraftTemplate,
} from "@/features/task-templates/services/template-service";

export async function createTaskTemplateAction(
  input: unknown,
): Promise<ApiResponse<TaskTemplateRecord>> {
  const ctx = await requireAuthContext();
  return createDraftTemplate({
    input,
    createdByUserId: ctx.user.id,
  });
}

export async function updateTaskTemplateAction(params: {
  id: string;
  input: unknown;
}): Promise<ApiResponse<TaskTemplateRecord>> {
  const ctx = await requireAuthContext();
  return updateDraftTemplate({
    id: params.id,
    input: params.input,
    updatedByUserId: ctx.user.id,
  });
}

export async function publishTaskTemplateAction(
  id: string,
): Promise<ApiResponse<TaskTemplateRecord>> {
  const ctx = await requireAuthContext();
  return publishTemplate({ id, updatedByUserId: ctx.user.id });
}

export async function archiveTaskTemplateAction(
  id: string,
): Promise<ApiResponse<TaskTemplateRecord>> {
  const ctx = await requireAuthContext();
  return archiveTemplate({ id, updatedByUserId: ctx.user.id });
}

export async function newTaskTemplateVersionAction(
  id: string,
): Promise<ApiResponse<TaskTemplateRecord>> {
  const ctx = await requireAuthContext();
  return createNewTemplateVersion({
    id,
    createdByUserId: ctx.user.id,
  });
}

export async function listTaskTemplatesAction(filter?: {
  status?: TaskTemplateRecord["status"];
  category?: string;
}): Promise<ApiResponse<TaskTemplateRecord[]>> {
  await requireAuthContext();
  const rows = await listTemplates(filter);
  return { ok: true, data: rows };
}

export async function getTaskTemplateAction(
  publicId: string,
): Promise<ApiResponse<TaskTemplateRecord>> {
  await requireAuthContext();
  const row = await getTemplateByPublicId(publicId);
  if (!row) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Template not found" },
    };
  }
  return { ok: true, data: row };
}
