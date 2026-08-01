/**
 * File / object storage architecture constants — enterprise asset platform.
 */

export const FILE_KINDS = [
  "image",
  "video",
  "audio",
  "pdf",
  "csv",
  "zip",
  "evidence",
  "export",
  "other",
] as const;

export type FileKind = (typeof FILE_KINDS)[number];

/** Business asset categories (map to buckets; no new tables). */
export const STORAGE_ASSET_TYPES = [
  "profile_photo",
  "organization_logo",
  "campaign_asset",
  "marketplace_photo",
  "submission_evidence",
  "receipt",
  "invoice",
  "document",
  "future_media",
] as const;

export type StorageAssetType = (typeof STORAGE_ASSET_TYPES)[number];

export const STORAGE_BUCKETS = [
  "public-brand",
  "avatars",
  "campaign-assets",
  "submission-evidence",
  "exports",
  "temp-uploads",
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

/** Public vs private bucket policy (enforced in adapter + docs). */
export const STORAGE_BUCKET_VISIBILITY: Record<
  StorageBucket,
  "public" | "private"
> = {
  "public-brand": "public",
  avatars: "public",
  "campaign-assets": "private",
  "submission-evidence": "private",
  exports: "private",
  "temp-uploads": "private",
};

export const ASSET_TYPE_TO_BUCKET: Record<StorageAssetType, StorageBucket> = {
  profile_photo: "avatars",
  organization_logo: "public-brand",
  campaign_asset: "campaign-assets",
  marketplace_photo: "campaign-assets",
  submission_evidence: "submission-evidence",
  receipt: "exports",
  invoice: "exports",
  document: "exports",
  future_media: "temp-uploads",
};

/** Allowed MIME prefixes / exact types per asset category. */
export const ASSET_ALLOWED_MIME: Record<StorageAssetType, readonly string[]> = {
  profile_photo: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  organization_logo: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  campaign_asset: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "video/mp4",
  ],
  marketplace_photo: ["image/jpeg", "image/png", "image/webp"],
  submission_evidence: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "audio/mpeg",
    "audio/wav",
    "application/pdf",
    "application/octet-stream",
  ],
  receipt: ["image/jpeg", "image/png", "application/pdf"],
  invoice: ["application/pdf", "image/jpeg", "image/png"],
  document: [
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/zip",
    "image/jpeg",
    "image/png",
  ],
  future_media: ["image/", "video/", "audio/", "application/"],
};

export const UPLOAD_CONSTRAINTS = {
  maxFileSizeBytes: 100 * 1024 * 1024,
  evidenceMaxBytes: 500 * 1024 * 1024,
  profilePhotoMaxBytes: 5 * 1024 * 1024,
  organizationLogoMaxBytes: 5 * 1024 * 1024,
  chunkedUploadThresholdBytes: 50 * 1024 * 1024,
  virusScan: "hook_required" as const,
  generateWebPOnImageUpload: true,
  thumbnailMaxEdgePx: 320,
  defaultSignedUploadTtlSec: 2 * 60 * 60,
  defaultSignedDownloadTtlSec: 15 * 60,
  tempUploadRetentionHours: 24,
  softDeleteRetentionDays: 30,
} as const;

/** Evidence container alias → canonical bucket (legacy "evidence" accepted). */
export function resolveEvidenceContainer(container: string): StorageBucket {
  if (container === "evidence" || container === "submission-evidence") {
    return "submission-evidence";
  }
  if ((STORAGE_BUCKETS as readonly string[]).includes(container)) {
    return container as StorageBucket;
  }
  return "submission-evidence";
}
