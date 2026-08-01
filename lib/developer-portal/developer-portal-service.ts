/**
 * DeveloperPortalService — facade for portal content + generators.
 * Consumes Public API / OpenAPI only — never domain services.
 */

import {
  isApiExplorerEnabled,
  isDeveloperPortalEnabled,
  isSdkGenerationEnabled,
  DEVELOPER_PORTAL_MODEL_VERSION,
} from "@/lib/developer-portal/config";
import { listPortalSections, getPortalSection, portalCoverageRatio } from "@/lib/developer-portal/sections";
import { SDKGenerator } from "@/lib/developer-portal/sdk-generator";
import { APIExplorer } from "@/lib/developer-portal/api-explorer";
import { ExampleGenerator } from "@/lib/developer-portal/example-generator";
import { QuickStartGenerator } from "@/lib/developer-portal/quickstart-generator";
import { ChangelogService } from "@/lib/developer-portal/changelog-service";
import {
  getPortalTelemetrySnapshot,
  setDocumentationCoverage,
  setOpenApiFreshness,
} from "@/lib/developer-portal/telemetry";
import { generateOpenApiDocument } from "@/lib/public-api/openapi/generator";
import { V1_ROUTES } from "@/lib/public-api/routes/v1";
import type { ApiExplorerRequest } from "@/lib/developer-portal/types";

export function getPortalHome() {
  if (!isDeveloperPortalEnabled()) {
    return { ok: false as const, error: "DEVELOPER_PORTAL disabled" };
  }
  setDocumentationCoverage(portalCoverageRatio());
  return {
    ok: true as const,
    modelVersion: DEVELOPER_PORTAL_MODEL_VERSION,
    apiVersion: "v1",
    sections: listPortalSections(),
    quickStart: QuickStartGenerator.generate(),
    exampleCount: ExampleGenerator.generate().length,
    operationCount: V1_ROUTES.filter((r) => r.path !== "/openapi.json").length,
  };
}

export const DeveloperPortalService = {
  home: getPortalHome,
  sections: listPortalSections,
  getSection: getPortalSection,
  quickStart: () => QuickStartGenerator.generate(),
  examples: () => ExampleGenerator.generate(),
  getExample: (id: string) => ExampleGenerator.get(id),
  changelog: () => ChangelogService.list(),
  migrationGuide: (from: string, to: string) =>
    ChangelogService.migrationGuide(from, to),

  generateSdk() {
    if (!isSdkGenerationEnabled()) {
      return { ok: false as const, error: "SDK_GENERATION disabled" };
    }
    const bundle = SDKGenerator.generate();
    if ("error" in bundle) return { ok: false as const, error: bundle.error };
    return { ok: true as const, bundle };
  },

  listOperations() {
    if (!isApiExplorerEnabled()) return [];
    return APIExplorer.listOperations();
  },

  preview(input: ApiExplorerRequest) {
    if (!isApiExplorerEnabled()) {
      return { ok: false as const, error: "API_EXPLORER disabled" };
    }
    const result = APIExplorer.preview(input);
    if ("error" in result) return { ok: false as const, error: result.error };
    return { ok: true as const, preview: result };
  },

  openApi() {
    const doc = generateOpenApiDocument();
    setOpenApiFreshness(0);
    return doc;
  },

  health() {
    // Refresh coverage metrics
    ExampleGenerator.generate();
    setDocumentationCoverage(portalCoverageRatio());
    const telemetry = getPortalTelemetrySnapshot();
    return {
      portalEnabled: isDeveloperPortalEnabled(),
      sdkGenerationEnabled: isSdkGenerationEnabled(),
      apiExplorerEnabled: isApiExplorerEnabled(),
      modelVersion: DEVELOPER_PORTAL_MODEL_VERSION,
      ...telemetry,
      sectionCount: listPortalSections().length,
      exampleCount: ExampleGenerator.generate().length,
      operationCount: V1_ROUTES.filter((r) => r.path !== "/openapi.json").length,
    };
  },
};
