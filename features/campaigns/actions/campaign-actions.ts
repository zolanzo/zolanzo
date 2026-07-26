"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type { CampaignStatus } from "@/constants/work-states";
import type { CampaignRecord } from "@/features/campaigns/types";
import type { OrgEligibilityPolicy } from "@/features/campaigns/types";
import type { TemplateConstraint } from "@/constants/constraints";
import {
  archiveCampaign,
  cloneCampaign,
  createDraftCampaign,
  duplicateCampaign,
  getCampaignByPublicId,
  listCampaigns,
  pauseCampaign,
  publishCampaign,
  resolveCampaignEligibility,
  resumeCampaign,
  submitCampaignForReview,
  transitionCampaign,
  updateDraftCampaign,
} from "@/features/campaigns/services/campaign-service";

export async function createCampaignAction(
  input: unknown,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return createDraftCampaign({
    input,
    createdByUserId: ctx.user.id,
  });
}

export async function updateCampaignAction(params: {
  id: string;
  input: unknown;
}): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return updateDraftCampaign({
    id: params.id,
    input: params.input,
    updatedByUserId: ctx.user.id,
  });
}

export async function publishCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return publishCampaign({ id, updatedByUserId: ctx.user.id });
}

export async function submitCampaignReviewAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return submitCampaignForReview({ id, updatedByUserId: ctx.user.id });
}

export async function archiveCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return archiveCampaign({ id, updatedByUserId: ctx.user.id });
}

export async function pauseCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return pauseCampaign({ id, updatedByUserId: ctx.user.id });
}

export async function resumeCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return resumeCampaign({ id, updatedByUserId: ctx.user.id });
}

export async function transitionCampaignAction(params: {
  id: string;
  to: CampaignStatus;
}): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return transitionCampaign({
    id: params.id,
    to: params.to,
    updatedByUserId: ctx.user.id,
  });
}

export async function duplicateCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return duplicateCampaign({ id, createdByUserId: ctx.user.id });
}

export async function cloneCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  return cloneCampaign({ id, createdByUserId: ctx.user.id });
}

export async function listCampaignsAction(filter?: {
  organizationId?: string;
  status?: CampaignStatus;
  category?: string;
}): Promise<ApiResponse<CampaignRecord[]>> {
  await requireAuthContext();
  const rows = await listCampaigns(filter);
  return { ok: true, data: rows };
}

export async function getCampaignAction(
  publicId: string,
): Promise<ApiResponse<CampaignRecord>> {
  await requireAuthContext();
  const row = await getCampaignByPublicId(publicId);
  if (!row) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Campaign not found" },
    };
  }
  return { ok: true, data: row };
}

export async function resolveCampaignEligibilityAction(params: {
  campaignId: string;
  organizationPolicies?: OrgEligibilityPolicy | null;
}): Promise<
  ApiResponse<{
    constraints: TemplateConstraint[];
    sourceById: Record<string, "organization" | "template" | "campaign">;
  }>
> {
  await requireAuthContext();
  return resolveCampaignEligibility(params);
}
