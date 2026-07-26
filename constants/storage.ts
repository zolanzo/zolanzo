/**
 * File / object storage architecture constants.
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

export const STORAGE_BUCKETS = [
  "public-brand",
  "avatars",
  "campaign-assets",
  "submission-evidence",
  "exports",
  "temp-uploads",
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

export const UPLOAD_CONSTRAINTS = {
  maxFileSizeBytes: 100 * 1024 * 1024,
  evidenceMaxBytes: 500 * 1024 * 1024,
  chunkedUploadThresholdBytes: 50 * 1024 * 1024,
  virusScan: "hook_required",
  generateWebPOnImageUpload: true,
} as const;
