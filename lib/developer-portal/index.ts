/**
 * Developer Portal — Phase 4.5D exports.
 */

export {
  DEVELOPER_PORTAL_MODEL_VERSION,
  PORTAL_SECTIONS,
  type PortalSection,
  type SdkBundle,
  type CodeExample,
  type ApiExplorerResult,
  type ChangelogEntry,
} from "@/lib/developer-portal/types";

export {
  isDeveloperPortalEnabled,
  isSdkGenerationEnabled,
  isApiExplorerEnabled,
} from "@/lib/developer-portal/config";

export { DeveloperPortalService } from "@/lib/developer-portal/developer-portal-service";
export { SDKGenerator } from "@/lib/developer-portal/sdk-generator";
export { APIExplorer } from "@/lib/developer-portal/api-explorer";
export { ExampleGenerator } from "@/lib/developer-portal/example-generator";
export { QuickStartGenerator } from "@/lib/developer-portal/quickstart-generator";
export { ChangelogService } from "@/lib/developer-portal/changelog-service";

export {
  getPortalTelemetrySnapshot,
  resetPortalTelemetryForTests,
} from "@/lib/developer-portal/telemetry";
