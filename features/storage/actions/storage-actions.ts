"use server";

/**
 * Storage platform server actions — signed URLs + server put.
 */

import { requireAuthContext } from "@/lib/auth/session";
import {
  createSignedDownloadSession,
  createSignedUploadSession,
  putAssetBytes,
} from "@/features/storage/services/asset-platform";
import { setAvatarUrl } from "@/features/users/services/profile-service";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, AppError } from "@/lib/api/response";

export async function createSignedUploadAction(
  input: unknown,
): Promise<ApiResponse<unknown>> {
  const auth = await requireAuthContext();
  return createSignedUploadSession({
    input,
    actorUserId: auth.user.id,
  });
}

export async function createSignedDownloadAction(
  input: unknown,
): Promise<ApiResponse<unknown>> {
  const auth = await requireAuthContext();
  const isAdmin = auth.user.platformRoles.some((r) =>
    ["admin", "super_admin", "operations", "auditor"].includes(r),
  );
  return createSignedDownloadSession({
    input,
    actorUserId: auth.user.id,
    organizationIds: auth.user.memberships.map((m) => m.organizationId),
    isAdmin,
  });
}

export async function putAssetAction(
  input: unknown,
): Promise<ApiResponse<unknown>> {
  const auth = await requireAuthContext();
  return putAssetBytes({
    input,
    actorUserId: auth.user.id,
    actor: auth.actor,
    orgRole: auth.activeOrgRole,
  });
}

/** Profile photo upload → storage put → setAvatarUrl (existing field). */
export async function uploadProfilePhotoAction(input: {
  filename: string;
  contentType: string;
  bodyBase64: string;
}): Promise<ApiResponse<{ avatarUrl: string; objectKey: string }>> {
  try {
    const auth = await requireAuthContext();
    const stored = await putAssetBytes({
      input: {
        assetType: "profile_photo",
        filename: input.filename,
        contentType: input.contentType,
        bodyBase64: input.bodyBase64,
        generateThumbnail: true,
      },
      actorUserId: auth.user.id,
    });
    if (!stored.ok) return stored;

    const avatar = await setAvatarUrl(auth.user.id, stored.data.url);
    if (!avatar.ok) return avatar;

    return {
      ok: true,
      data: {
        avatarUrl: stored.data.url,
        objectKey: stored.data.objectKey,
      },
    };
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PROFILE_PHOTO_FAILED",
      error instanceof Error ? error.message : "Could not upload profile photo",
    );
  }
}
