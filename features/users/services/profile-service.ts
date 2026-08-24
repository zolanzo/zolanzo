import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import {
  updatePrivateProfileSchema,
  updatePublicProfileSchema,
} from "@/features/authentication/validators/auth";
import { writeAuditLog } from "@/lib/audit/write";

export type PublicProfile = {
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  countryCode: string | null;
};

export type PrivateProfile = {
  legalName: string | null;
  dateOfBirth: Date | null;
  addressJson: unknown;
  marketingOptIn: boolean;
};

export async function getPublicProfile(
  userId: string,
): Promise<PublicProfile | null> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;
  return {
    displayName: profile.displayName,
    handle: profile.handle,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    countryCode: profile.countryCode,
  };
}

export async function getPrivateProfile(
  userId: string,
): Promise<PrivateProfile | null> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;
  return {
    legalName: profile.legalName,
    dateOfBirth: profile.dateOfBirth,
    addressJson: profile.addressJson,
    marketingOptIn: profile.marketingOptIn,
  };
}

export async function updatePublicProfile(
  userId: string,
  raw: unknown,
): Promise<ApiResponse<PublicProfile>> {
  try {
    const input = updatePublicProfileSchema.parse(raw);
    const existing = await prisma.profile.findUnique({
      where: { handle: input.handle },
    });
    if (existing && existing.userId !== userId) {
      throw new AppError("HANDLE_TAKEN", "Handle is already taken", 409);
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        handle: input.handle,
        bio: input.bio ?? null,
        countryCode: input.countryCode ?? null,
      },
    });

    await writeAuditLog({
      actorUserId: userId,
      action: "user.updated",
      resourceType: "profile",
      resourceId: profile.id,
      metadata: { scope: "public" },
    });

    return apiSuccess({
      displayName: profile.displayName,
      handle: profile.handle,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      countryCode: profile.countryCode,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("PROFILE_UPDATE_FAILED", "Could not update profile");
  }
}

export async function updatePrivateProfile(
  userId: string,
  raw: unknown,
): Promise<ApiResponse<PrivateProfile>> {
  try {
    const input = updatePrivateProfileSchema.parse(raw);
    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        legalName: input.legalName ?? null,
        ...(input.marketingOptIn !== undefined
          ? { marketingOptIn: input.marketingOptIn }
          : {}),
        ...(input.addressJson !== undefined
          ? { addressJson: input.addressJson as Prisma.InputJsonValue }
          : {}),
      },
    });

    await writeAuditLog({
      actorUserId: userId,
      action: "user.updated",
      resourceType: "profile",
      resourceId: profile.id,
      metadata: { scope: "private" },
    });

    return apiSuccess({
      legalName: profile.legalName,
      dateOfBirth: profile.dateOfBirth,
      addressJson: profile.addressJson,
      marketingOptIn: profile.marketingOptIn,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("PROFILE_UPDATE_FAILED", "Could not update private profile");
  }
}

/**
 * Avatar upload interface — accepts a final URL (storage upload happens elsewhere).
 * Uses existing image pipeline only when callers process buffers first.
 */
export async function setAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<ApiResponse<{ avatarUrl: string | null }>> {
  try {
    if (avatarUrl && !/^https?:\/\//.test(avatarUrl) && !avatarUrl.startsWith("/")) {
      throw new AppError("INVALID_AVATAR_URL", "Avatar URL is invalid", 400);
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });

    return apiSuccess({ avatarUrl: profile.avatarUrl });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("AVATAR_UPDATE_FAILED", "Could not update avatar");
  }
}
