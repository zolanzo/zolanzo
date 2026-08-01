/**
 * Asset platform — signed upload/download, validation, virus hook, image opts.
 * No schema redesign; URLs land in existing fields (e.g. Profile.avatarUrl).
 */

import "server-only";

import {
  ASSET_TYPE_TO_BUCKET,
  STORAGE_BUCKET_VISIBILITY,
  UPLOAD_CONSTRAINTS,
  type StorageAssetType,
  type StorageBucket,
} from "@/constants/storage";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import {
  getStorageProvider,
  isOptimizableImage,
  optimizeImage,
  runVirusScan,
  sha256Hex,
  validateUpload,
} from "@/lib/integrations/storage";
import { assertCanInOrg } from "@/lib/rbac/access";
import type { OrgRole } from "@/constants/org-roles";
import type { ActorContext } from "@/types/domain";
import { z } from "zod";

export type SignedUploadSession = {
  assetType: StorageAssetType;
  bucket: StorageBucket;
  objectKey: string;
  signedUrl: string;
  token: string;
  expiresAt: string;
  checksumHint?: string;
};

export type SignedDownloadSession = {
  bucket: StorageBucket;
  objectKey: string;
  signedUrl: string;
  expiresAt: string;
};

export type StoredAssetResult = {
  bucket: StorageBucket;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  url: string;
  thumbnailObjectKey?: string;
  width?: number;
  height?: number;
};

function ownerScopedKey(params: {
  assetType: StorageAssetType;
  ownerId: string;
  organizationId?: string | null;
  filename: string;
  checksum?: string;
}): string {
  const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const digest = params.checksum?.slice(0, 16) ?? "pending";
  switch (params.assetType) {
    case "profile_photo":
      return `users/${params.ownerId}/avatar/${digest}-${safeName}`;
    case "organization_logo":
      return `orgs/${params.organizationId ?? params.ownerId}/logo/${digest}-${safeName}`;
    case "campaign_asset":
      return `orgs/${params.organizationId ?? "na"}/campaigns/${digest}-${safeName}`;
    case "marketplace_photo":
      return `orgs/${params.organizationId ?? "na"}/marketplace/${digest}-${safeName}`;
    case "submission_evidence":
      return `submissions/${params.ownerId}/${digest}-${safeName}`;
    case "receipt":
    case "invoice":
    case "document":
      return `orgs/${params.organizationId ?? params.ownerId}/docs/${params.assetType}/${digest}-${safeName}`;
    default:
      return `temp/${params.ownerId}/${digest}-${safeName}`;
  }
}

export const createSignedUploadSchema = z.object({
  assetType: z.enum([
    "profile_photo",
    "organization_logo",
    "campaign_asset",
    "marketplace_photo",
    "submission_evidence",
    "receipt",
    "invoice",
    "document",
    "future_media",
  ]),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive(),
  organizationId: z.string().min(1).optional().nullable(),
});

export async function createSignedUploadSession(params: {
  input: unknown;
  actorUserId: string;
}): Promise<ApiResponse<SignedUploadSession>> {
  try {
    const parsed = createSignedUploadSchema.parse(params.input);
    const validation = validateUpload({
      assetType: parsed.assetType,
      contentType: parsed.contentType,
      sizeBytes: parsed.sizeBytes,
    });
    if (!validation.ok) {
      throw new AppError(validation.code, validation.message, 400);
    }

    const bucket = ASSET_TYPE_TO_BUCKET[parsed.assetType];
    const objectKey = ownerScopedKey({
      assetType: parsed.assetType,
      ownerId: params.actorUserId,
      organizationId: parsed.organizationId,
      filename: parsed.filename,
    });

    const storage = getStorageProvider();
    const signed = await storage.createSignedUploadUrl({
      bucket,
      key: objectKey,
      expiresInSec: UPLOAD_CONSTRAINTS.defaultSignedUploadTtlSec,
      upsert: true,
    });

    return apiSuccess({
      assetType: parsed.assetType,
      bucket,
      objectKey,
      signedUrl: signed.signedUrl,
      token: signed.token,
      expiresAt: signed.expiresAt,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "SIGNED_UPLOAD_FAILED",
      error instanceof Error ? error.message : "Could not create upload session",
    );
  }
}

export const createSignedDownloadSchema = z.object({
  bucket: z.enum([
    "public-brand",
    "avatars",
    "campaign-assets",
    "submission-evidence",
    "exports",
    "temp-uploads",
  ]),
  objectKey: z.string().min(1).max(500),
  expiresInSec: z.number().int().positive().max(86_400).optional(),
  download: z.union([z.boolean(), z.string()]).optional(),
});

/**
 * Owner / org isolation for private buckets.
 * Paths are namespaced: users/{userId}/… or orgs/{orgId}/… or submissions/…
 */
export function assertStorageObjectAccess(params: {
  bucket: StorageBucket;
  objectKey: string;
  actorUserId: string;
  organizationIds: string[];
  isAdmin?: boolean;
}): void {
  if (params.isAdmin) return;
  if (STORAGE_BUCKET_VISIBILITY[params.bucket] === "public") return;

  const key = params.objectKey;
  if (key.startsWith(`users/${params.actorUserId}/`)) return;
  if (key.startsWith(`submissions/${params.actorUserId}/`)) return;
  for (const orgId of params.organizationIds) {
    if (key.startsWith(`orgs/${orgId}/`)) return;
  }
  throw new AppError(
    "STORAGE_FORBIDDEN",
    "Not allowed to access this storage object",
    403,
  );
}

export async function createSignedDownloadSession(params: {
  input: unknown;
  actorUserId: string;
  organizationIds: string[];
  isAdmin?: boolean;
}): Promise<ApiResponse<SignedDownloadSession>> {
  try {
    const parsed = createSignedDownloadSchema.parse(params.input);
    assertStorageObjectAccess({
      bucket: parsed.bucket,
      objectKey: parsed.objectKey,
      actorUserId: params.actorUserId,
      organizationIds: params.organizationIds,
      isAdmin: params.isAdmin,
    });

    const storage = getStorageProvider();
    const signed = await storage.createSignedDownloadUrl({
      bucket: parsed.bucket,
      key: parsed.objectKey,
      expiresInSec:
        parsed.expiresInSec ?? UPLOAD_CONSTRAINTS.defaultSignedDownloadTtlSec,
      download: parsed.download,
    });

    return apiSuccess({
      bucket: parsed.bucket,
      objectKey: parsed.objectKey,
      signedUrl: signed.signedUrl,
      expiresAt: signed.expiresAt,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "SIGNED_DOWNLOAD_FAILED",
      error instanceof Error ? error.message : "Could not create download session",
    );
  }
}

export const putAssetSchema = z.object({
  assetType: z.enum([
    "profile_photo",
    "organization_logo",
    "campaign_asset",
    "marketplace_photo",
    "submission_evidence",
    "receipt",
    "invoice",
    "document",
    "future_media",
  ]),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(3).max(120),
  bodyBase64: z.string().min(1),
  organizationId: z.string().min(1).optional().nullable(),
  generateThumbnail: z.boolean().optional(),
});

function decodeBase64(value: string): Uint8Array {
  const cleaned = value.includes(",") ? value.split(",").pop()! : value;
  return Uint8Array.from(Buffer.from(cleaned, "base64"));
}

/**
 * Server-side put (tests / small assets). Runs validation + virus hook + optional image opts.
 */
export async function putAssetBytes(params: {
  input: unknown;
  actorUserId: string;
  actor?: ActorContext;
  orgRole?: OrgRole | null;
}): Promise<ApiResponse<StoredAssetResult>> {
  try {
    const parsed = putAssetSchema.parse(params.input);
    const body = decodeBase64(parsed.bodyBase64);
    const validation = validateUpload({
      assetType: parsed.assetType,
      contentType: parsed.contentType,
      sizeBytes: body.byteLength,
    });
    if (!validation.ok) {
      throw new AppError(validation.code, validation.message, 400);
    }

    if (
      parsed.organizationId &&
      params.actor &&
      params.orgRole &&
      (parsed.assetType === "organization_logo" ||
        parsed.assetType === "campaign_asset")
    ) {
      assertCanInOrg(params.actor, "org.settings.write", params.orgRole);
    }

    const bucket = ASSET_TYPE_TO_BUCKET[parsed.assetType];
    const checksum = await sha256Hex(body);
    const scan = await runVirusScan({
      body,
      contentType: parsed.contentType,
      objectKey: checksum,
      bucket,
    });
    if (!scan.clean) {
      throw new AppError(
        "VIRUS_SCAN_FAILED",
        scan.details ?? "Upload rejected by virus scan",
        400,
      );
    }

    const objectKey = ownerScopedKey({
      assetType: parsed.assetType,
      ownerId: params.actorUserId,
      organizationId: parsed.organizationId,
      filename: parsed.filename,
      checksum,
    });

    const storage = getStorageProvider();
    let uploadBody = body;
    let contentType = parsed.contentType;
    let thumbnailObjectKey: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (
      (parsed.generateThumbnail ?? UPLOAD_CONSTRAINTS.generateWebPOnImageUpload) &&
      isOptimizableImage(parsed.contentType)
    ) {
      const optimized = await optimizeImage(body);
      uploadBody = optimized.webp;
      contentType = "image/webp";
      width = optimized.width;
      height = optimized.height;
      thumbnailObjectKey = `${objectKey}.thumb.webp`;
      await storage.putObject({
        bucket,
        key: thumbnailObjectKey,
        body: Buffer.from(optimized.thumbnail),
        contentType: "image/webp",
      });
    }

    const put = await storage.putObject({
      bucket,
      key: objectKey,
      body: Buffer.from(uploadBody),
      contentType,
    });

    return apiSuccess({
      bucket,
      objectKey,
      contentType,
      sizeBytes: uploadBody.byteLength,
      checksumSha256: checksum,
      url: put.url,
      thumbnailObjectKey,
      width,
      height,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PUT_ASSET_FAILED",
      error instanceof Error ? error.message : "Could not store asset",
    );
  }
}
