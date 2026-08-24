"use server";

import type { ApiResponse } from "@/lib/api/response";
import { AppError } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import { assertCampaignAccess, isOrgMember } from "@/lib/auth/resource-guards";
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
  approveCampaignForMarketplace,
  rejectCampaignReview,
  transitionCampaign,
  updateDraftCampaign,
} from "@/features/campaigns/services/campaign-service";
import { campaignRepository } from "@/features/campaigns/repositories";
import { requirePlatformRoles } from "@/lib/rbac/guards";
import { canModerateMarketplaceCampaign } from "@/features/campaigns/services/moderation";

async function requireCampaignAccess(campaignId: string) {
  const ctx = await requireAuthContext();
  const campaign = await campaignRepository.findById(campaignId);
  if (!campaign) {
    throw new AppError("NOT_FOUND", "Campaign not found", 404);
  }
  assertCampaignAccess({
    user: ctx.user,
    organizationId: campaign.organizationId,
    clientUserId: campaign.clientUserId,
  });
  return { ctx, campaign };
}

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
  try {
    const { ctx } = await requireCampaignAccess(params.id);
    return updateDraftCampaign({
      id: params.id,
      input: params.input,
      updatedByUserId: ctx.user.id,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function publishCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const ctx = await requirePlatformRoles(
      "admin",
      "super_admin",
      "operations",
      "moderator",
    );
    await requireCampaignAccess(id);
    return publishCampaign({ id, updatedByUserId: ctx.user.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function approveCampaignAction(
  id: string,
): Promise<
  ApiResponse<{ campaign: CampaignRecord; inventoryCreated: number }>
> {
  try {
    const ctx = await requirePlatformRoles(
      "admin",
      "super_admin",
      "operations",
      "moderator",
    );
    await requireCampaignAccess(id);
    return approveCampaignForMarketplace({
      id,
      updatedByUserId: ctx.user.id,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function rejectCampaignAction(
  id: string,
  reason?: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const ctx = await requirePlatformRoles(
      "admin",
      "super_admin",
      "operations",
      "moderator",
    );
    await requireCampaignAccess(id);
    return rejectCampaignReview({
      id,
      updatedByUserId: ctx.user.id,
      reason: reason ?? null,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function submitCampaignReviewAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const { ctx } = await requireCampaignAccess(id);
    return submitCampaignForReview({ id, updatedByUserId: ctx.user.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function archiveCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const { ctx } = await requireCampaignAccess(id);
    return archiveCampaign({ id, updatedByUserId: ctx.user.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function pauseCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const { ctx } = await requireCampaignAccess(id);
    return pauseCampaign({ id, updatedByUserId: ctx.user.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function resumeCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const { ctx } = await requireCampaignAccess(id);
    return resumeCampaign({ id, updatedByUserId: ctx.user.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function transitionCampaignAction(params: {
  id: string;
  to: CampaignStatus;
}): Promise<ApiResponse<CampaignRecord>> {
  try {
    const { ctx, campaign } = await requireCampaignAccess(params.id);
    if (
      (params.to === "active" || params.to === "scheduled") &&
      (campaign.status === "draft" || campaign.status === "pending_review")
    ) {
      if (!canModerateMarketplaceCampaign(ctx.user.platformRoles)) {
        throw new AppError(
          "MODERATION_REQUIRED",
          "Staff approval is required before a campaign can become available",
          403,
        );
      }
    }
    return transitionCampaign({
      id: params.id,
      to: params.to,
      updatedByUserId: ctx.user.id,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function duplicateCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const { ctx } = await requireCampaignAccess(id);
    return duplicateCampaign({ id, createdByUserId: ctx.user.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function cloneCampaignAction(
  id: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const { ctx } = await requireCampaignAccess(id);
    return cloneCampaign({ id, createdByUserId: ctx.user.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}

export async function listCampaignsAction(filter?: {
  organizationId?: string;
  status?: CampaignStatus;
  category?: string;
}): Promise<ApiResponse<CampaignRecord[]>> {
  const ctx = await requireAuthContext();
  const memberOrgIds = new Set(
    ctx.user.memberships
      .filter((m) => m.status === "active")
      .map((m) => m.organizationId),
  );
  if (filter?.organizationId && !isOrgMember(ctx.user, filter.organizationId)) {
    const isStaff = ctx.user.platformRoles.some((r) =>
      ["admin", "super_admin", "operations", "finance", "auditor"].includes(r),
    );
    if (!isStaff) {
      return {
        ok: false,
        error: { code: "FORBIDDEN", message: "Not a member of this organization" },
      };
    }
  }
  const rows = await listCampaigns(filter);
  const isStaff = ctx.user.platformRoles.some((r) =>
    ["admin", "super_admin", "operations", "finance", "auditor"].includes(r),
  );
  const visible = isStaff
    ? rows
    : rows.filter(
        (r) =>
          r.clientUserId === ctx.user.id || memberOrgIds.has(r.organizationId),
      );
  return { ok: true, data: visible };
}

export async function getCampaignAction(
  publicId: string,
): Promise<ApiResponse<CampaignRecord>> {
  try {
    const ctx = await requireAuthContext();
    const row = await getCampaignByPublicId(publicId);
    if (!row) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Campaign not found" },
      };
    }
    assertCampaignAccess({
      user: ctx.user,
      organizationId: row.organizationId,
      clientUserId: row.clientUserId,
    });
    return { ok: true, data: row };
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
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
  try {
    await requireCampaignAccess(params.campaignId);
    return resolveCampaignEligibility(params);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }
}
