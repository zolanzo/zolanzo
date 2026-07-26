"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import {
  setAvatarUrl,
  updatePrivateProfile,
  updatePublicProfile,
  type PrivateProfile,
  type PublicProfile,
} from "@/features/users/services/profile-service";

export async function updatePublicProfileAction(
  input: unknown,
): Promise<ApiResponse<PublicProfile>> {
  const ctx = await requireAuthContext();
  return updatePublicProfile(ctx.user.id, input);
}

export async function updatePrivateProfileAction(
  input: unknown,
): Promise<ApiResponse<PrivateProfile>> {
  const ctx = await requireAuthContext();
  return updatePrivateProfile(ctx.user.id, input);
}

export async function setAvatarUrlAction(
  avatarUrl: string | null,
): Promise<ApiResponse<{ avatarUrl: string | null }>> {
  const ctx = await requireAuthContext();
  return setAvatarUrl(ctx.user.id, avatarUrl);
}
