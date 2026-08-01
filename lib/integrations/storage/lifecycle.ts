/**
 * Soft-delete + retention helpers (path conventions; no schema).
 */

import { UPLOAD_CONSTRAINTS } from "@/constants/storage";

export const TRASH_PREFIX = ".trash/";

export function toTrashKey(objectKey: string, deletedAt = new Date()): string {
  const stamp = deletedAt.toISOString().replace(/[:.]/g, "-");
  const cleaned = objectKey.replace(/^\.trash\//, "");
  return `${TRASH_PREFIX}${stamp}/${cleaned}`;
}

export function isTrashKey(objectKey: string): boolean {
  return objectKey.startsWith(TRASH_PREFIX);
}

export function parseTrashDeletedAt(objectKey: string): Date | null {
  if (!isTrashKey(objectKey)) return null;
  const rest = objectKey.slice(TRASH_PREFIX.length);
  const stamp = rest.split("/")[0];
  if (!stamp) return null;
  const iso = stamp.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "T$1:$2:$3.$4Z");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isPastSoftDeleteRetention(
  deletedAt: Date,
  now = new Date(),
): boolean {
  const ms =
    UPLOAD_CONSTRAINTS.softDeleteRetentionDays * 24 * 60 * 60 * 1000;
  return now.getTime() - deletedAt.getTime() >= ms;
}

export function isPastTempRetention(
  updatedAt: Date,
  now = new Date(),
): boolean {
  const ms = UPLOAD_CONSTRAINTS.tempUploadRetentionHours * 60 * 60 * 1000;
  return now.getTime() - updatedAt.getTime() >= ms;
}
