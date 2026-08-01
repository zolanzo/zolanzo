/**
 * MigrationGuideGenerator — Public API version migration playbooks.
 */

import type { MigrationGuide } from "@/lib/developer-portal/types";
import { ChangelogService } from "@/lib/developer-portal/changelog-service";

export function generateMigrationGuide(
  fromVersion: string,
  toVersion: string,
): MigrationGuide {
  const entries = ChangelogService.list();
  const breaking = entries.some(
    (e) =>
      e.breaking &&
      e.version.localeCompare(fromVersion) > 0 &&
      e.version.localeCompare(toVersion) <= 0,
  );

  return {
    from: fromVersion,
    to: toVersion,
    breaking,
    steps: [
      `Review changelog entries between ${fromVersion} and ${toVersion}.`,
      "Regenerate SDKs from the latest OpenAPI document (never hand-edit endpoints).",
      "Update scopes on API keys / OAuth clients for any new endpoints.",
      "Re-run webhook signature verification tests (X-Zolanzo-* headers).",
      "Validate examples via DeveloperPortalService.examples() — broken operationIds fail health.",
      breaking
        ? "Breaking changes require a new major API path (/api/v2) — do not dual-write business logic."
        : "Additive v1 changes require no path migration.",
    ],
  };
}

export const MigrationGuideGenerator = {
  generate: generateMigrationGuide,
};
