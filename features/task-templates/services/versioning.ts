/**
 * Template versioning rules — pure helpers.
 */

export type VersionStatus = "draft" | "published" | "archived";

export function canEditTemplate(status: VersionStatus): boolean {
  return status === "draft";
}

export function canPublishTemplate(status: VersionStatus): boolean {
  return status === "draft";
}

export function canArchiveTemplate(status: VersionStatus): boolean {
  return status === "published" || status === "draft";
}

export function nextVersionNumber(current: number): number {
  return current + 1;
}

/**
 * Published templates are immutable — edits must clone to a new draft version.
 */
export function requiresNewVersionForEdit(status: VersionStatus): boolean {
  return status === "published" || status === "archived";
}
