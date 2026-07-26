/**
 * Operational views service — wraps metrics into typed views.
 */

import "server-only";

import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import {
  OPERATIONAL_VIEW_KEYS,
  type OperationalViewKey,
} from "@/constants/operations";
import type { Role } from "@/constants/roles";
import { rolesHavePermission } from "@/constants/permissions";
import { collectOperationalMetrics } from "@/features/admin/services/metrics";
import {
  buildAllViews,
  buildOperationalView,
  type OperationalView,
} from "@/features/admin/services/operational-views";
import { z } from "zod";

export const getViewSchema = z.object({
  view: z.enum(OPERATIONAL_VIEW_KEYS),
});

export async function getOperationalView(params: {
  input: unknown;
  platformRoles: readonly Role[];
}): Promise<ApiResponse<OperationalView>> {
  try {
    if (!rolesHavePermission(params.platformRoles, "ops.views.read")) {
      throw new AppError("FORBIDDEN", "Missing ops.views.read", 403);
    }
    const parsed = getViewSchema.parse(params.input);
    const metrics = await collectOperationalMetrics();
    return apiSuccess(buildOperationalView(parsed.view, metrics));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "VIEW_FAILED",
      error instanceof Error ? error.message : "Could not load view",
    );
  }
}

export async function getAllOperationalViews(params: {
  platformRoles: readonly Role[];
}): Promise<ApiResponse<Record<OperationalViewKey, OperationalView>>> {
  try {
    if (!rolesHavePermission(params.platformRoles, "ops.views.read")) {
      throw new AppError("FORBIDDEN", "Missing ops.views.read", 403);
    }
    const metrics = await collectOperationalMetrics();
    return apiSuccess(buildAllViews(metrics));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "VIEWS_FAILED",
      error instanceof Error ? error.message : "Could not load views",
    );
  }
}
