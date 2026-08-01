/**
 * Integration Marketplace — Phase 4.5C exports.
 */

export {
  INTEGRATION_MARKETPLACE_MODEL_VERSION,
  CONNECTOR_CATEGORIES,
  CONNECTOR_LIFECYCLE_STATES,
  type ConnectorManifest,
  type ConnectorInstallation,
  type ConnectorCategory,
  type ConnectorHealthSnapshot,
} from "@/lib/marketplace/types";

export {
  isIntegrationMarketplaceEnabled,
  isConnectorRuntimeEnabled,
  isConnectorHealthEnabled,
} from "@/lib/marketplace/config";

export { IntegrationRegistry } from "@/lib/marketplace/integration-registry";
export { ConnectorManager } from "@/lib/marketplace/connector-manager";
export { ConnectorRuntime } from "@/lib/marketplace/connector-runtime";
export { CredentialManager } from "@/lib/marketplace/credential-manager";
export { ConnectorHealthService } from "@/lib/marketplace/connector-health";
export { IntegrationMarketplaceService } from "@/lib/marketplace/marketplace-service";
export { STARTER_CONNECTORS } from "@/lib/marketplace/connectors";

export {
  getMarketplaceTelemetrySnapshot,
  resetMarketplaceTelemetryForTests,
} from "@/lib/marketplace/telemetry";
export { resetMarketplaceStoreForTests } from "@/lib/marketplace/store";
export { resetConnectorRegistryForTests } from "@/lib/marketplace/integration-registry";
export { resetConnectorHealthForTests } from "@/lib/marketplace/connector-health";
