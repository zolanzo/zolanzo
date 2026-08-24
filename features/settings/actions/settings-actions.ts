"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/lib/audit/write";
import {
  accountProfileFormSchema,
  opportunityPreferencesSchema,
} from "@/features/settings/validators";
import {
  mergeAddressJson,
  readOpportunityPreferences,
} from "@/lib/profile/address-json";
import { updatePublicProfile } from "@/features/users/services/profile-service";
import type { OpportunityPreferences } from "@/features/settings/types";

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function saveAccountProfileAction(
  input: unknown,
): Promise<ApiResponse<{ displayName: string; handle: string }>> {
  try {
    const ctx = await requireAuthContext();
    const parsed = accountProfileFormSchema.parse(input);
    const publicResult = await updatePublicProfile(ctx.user.id, {
      displayName: parsed.displayName,
      handle: parsed.handle,
      bio: parsed.bio ?? null,
    });
    if (!publicResult.ok) return publicResult;

    const existing = await prisma.profile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true, addressJson: true },
    });
    if (!existing) {
      throw new AppError("PROFILE_MISSING", "Profile not found", 404);
    }

    const addressJson = mergeAddressJson(existing.addressJson, {
      state: parsed.preferredState ?? null,
      city: parsed.preferredCity ?? null,
    });

    await prisma.profile.update({
      where: { userId: ctx.user.id },
      data: {
        legalName: parsed.legalName ?? null,
        addressJson: addressJson as Prisma.InputJsonValue,
      },
    });

    await writeAuditLog({
      actorUserId: ctx.user.id,
      action: "user.updated",
      resourceType: "profile",
      resourceId: existing.id,
      metadata: { scope: "account_center" },
    });

    return apiSuccess({
      displayName: publicResult.data.displayName,
      handle: publicResult.data.handle,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PROFILE_UPDATE_FAILED",
      error instanceof Error ? error.message : "Could not save profile",
    );
  }
}

export async function saveOpportunityPreferencesAction(
  input: unknown,
): Promise<ApiResponse<OpportunityPreferences>> {
  try {
    const ctx = await requireAuthContext();
    const parsed = opportunityPreferencesSchema.parse(input);
    const existing = await prisma.profile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true, addressJson: true },
    });
    if (!existing) {
      throw new AppError("PROFILE_MISSING", "Profile not found", 404);
    }

    const current = readOpportunityPreferences(existing.addressJson);
    const next = { ...current, ...parsed };
    const addressJson = mergeAddressJson(existing.addressJson, {
      state: next.preferredState,
      city: next.preferredCity,
      opportunity: next,
    });

    await prisma.profile.update({
      where: { userId: ctx.user.id },
      data: { addressJson: addressJson as Prisma.InputJsonValue },
    });

    await writeAuditLog({
      actorUserId: ctx.user.id,
      action: "user.updated",
      resourceType: "profile",
      resourceId: existing.id,
      metadata: { scope: "opportunity_preferences" },
    });

    return apiSuccess(next);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PREFERENCES_UPDATE_FAILED",
      error instanceof Error ? error.message : "Could not save preferences",
    );
  }
}

export async function saveMarketingOptInAction(
  marketingOptIn: boolean,
): Promise<ApiResponse<{ marketingOptIn: boolean }>> {
  try {
    const ctx = await requireAuthContext();
    const profile = await prisma.profile.update({
      where: { userId: ctx.user.id },
      data: { marketingOptIn },
    });
    return apiSuccess({ marketingOptIn: profile.marketingOptIn });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PREFERENCES_UPDATE_FAILED",
      "Could not update notification preference",
    );
  }
}
