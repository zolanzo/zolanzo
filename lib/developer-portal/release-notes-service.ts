/**
 * ReleaseNotesService — public API release notes (changelog facade).
 */

import { ChangelogService } from "@/lib/developer-portal/changelog-service";
import type { ChangelogEntry } from "@/lib/developer-portal/types";

export function listReleaseNotes(): ChangelogEntry[] {
  return ChangelogService.list();
}

export function latestReleaseNote(): ChangelogEntry | undefined {
  return ChangelogService.list()[0];
}

export const ReleaseNotesService = {
  list: listReleaseNotes,
  latest: latestReleaseNote,
};
