/**
 * Upload validation — MIME + size (domain-safe, no vendor).
 */

import {
  ASSET_ALLOWED_MIME,
  UPLOAD_CONSTRAINTS,
  type StorageAssetType,
} from "@/constants/storage";

export type StorageValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function validateContentType(params: {
  assetType: StorageAssetType;
  contentType: string;
}): StorageValidationResult {
  const allowed = ASSET_ALLOWED_MIME[params.assetType];
  const ct = params.contentType.trim().toLowerCase();
  if (!ct) {
    return {
      ok: false,
      code: "CONTENT_TYPE_REQUIRED",
      message: "Content type required",
    };
  }
  const match = allowed.some((rule) =>
    rule.endsWith("/") ? ct.startsWith(rule) : ct === rule,
  );
  if (!match) {
    return {
      ok: false,
      code: "CONTENT_TYPE_REJECTED",
      message: `Content type ${params.contentType} not allowed for ${params.assetType}`,
    };
  }
  return { ok: true };
}

export function validateFileSize(params: {
  assetType: StorageAssetType;
  sizeBytes: number;
}): StorageValidationResult {
  if (params.sizeBytes <= 0) {
    return { ok: false, code: "EMPTY_FILE", message: "File is empty" };
  }
  let max = UPLOAD_CONSTRAINTS.maxFileSizeBytes;
  if (params.assetType === "submission_evidence") {
    max = UPLOAD_CONSTRAINTS.evidenceMaxBytes;
  } else if (params.assetType === "profile_photo") {
    max = UPLOAD_CONSTRAINTS.profilePhotoMaxBytes;
  } else if (params.assetType === "organization_logo") {
    max = UPLOAD_CONSTRAINTS.organizationLogoMaxBytes;
  }
  if (params.sizeBytes > max) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `File exceeds max size ${max} bytes for ${params.assetType}`,
    };
  }
  return { ok: true };
}

export function validateUpload(params: {
  assetType: StorageAssetType;
  contentType: string;
  sizeBytes: number;
}): StorageValidationResult {
  const typeCheck = validateContentType(params);
  if (!typeCheck.ok) return typeCheck;
  return validateFileSize(params);
}
