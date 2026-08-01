/**
 * IntegrationMarketplaceService — public facade for the marketplace.
 */

import {
  isConnectorHealthEnabled,
  isConnectorRuntimeEnabled,
  isIntegrationMarketplaceEnabled,
} from "@/lib/marketplace/config";
import { IntegrationRegistry } from "@/lib/marketplace/integration-registry";
import { ConnectorManager } from "@/lib/marketplace/connector-manager";
import { ConnectorRuntime } from "@/lib/marketplace/connector-runtime";
import { ConnectorHealthService } from "@/lib/marketplace/connector-health";
import { CredentialManager } from "@/lib/marketplace/credential-manager";
import { getMarketplaceTelemetrySnapshot } from "@/lib/marketplace/telemetry";
import { listInstallations } from "@/lib/marketplace/store";
import { INTEGRATION_MARKETPLACE_MODEL_VERSION } from "@/lib/marketplace/types";
import type { ConnectorCategory } from "@/lib/marketplace/types";

function publicInstallation(id: string) {
  const row = ConnectorManager.get(id);
  if (!row || row.lifecycle === "uninstalled") return null;
  return {
    id: row.id,
    publicId: row.publicId,
    connectorId: row.connectorId,
    connectorVersion: row.connectorVersion,
    organizationId: row.organizationId,
    lifecycle: row.lifecycle,
    config: row.config,
    configVersion: row.configVersion,
    enabled: row.enabled,
    lastSyncAt: row.lastSyncAt,
    lastError: row.lastError,
    authStatus: row.authStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const IntegrationMarketplaceService = {
  listAvailable(filter?: { category?: ConnectorCategory }) {
    if (!isIntegrationMarketplaceEnabled()) return [];
    return IntegrationRegistry.list(filter);
  },

  getManifest(connectorId: string) {
    if (!isIntegrationMarketplaceEnabled()) return undefined;
    return IntegrationRegistry.get(connectorId);
  },

  listInstalled(organizationId?: string) {
    if (!isIntegrationMarketplaceEnabled()) return [];
    return listInstallations(
      organizationId ? { organizationId } : undefined,
    ).map((i) => publicInstallation(i.id)!);
  },

  install(input: {
    connectorId: string;
    organizationId: string;
    config?: Record<string, string | boolean>;
  }) {
    if (!isIntegrationMarketplaceEnabled()) {
      return { ok: false as const, error: "INTEGRATION_MARKETPLACE disabled" };
    }
    const result = ConnectorManager.install(input);
    if ("error" in result) return { ok: false as const, error: result.error };
    return {
      ok: true as const,
      installation: publicInstallation(result.installation.id)!,
    };
  },

  configure(id: string, config: Record<string, string | boolean>) {
    if (!isIntegrationMarketplaceEnabled()) {
      return { ok: false as const, error: "INTEGRATION_MARKETPLACE disabled" };
    }
    const result = ConnectorManager.configure(id, config);
    if ("error" in result) return { ok: false as const, error: result.error };
    return { ok: true as const, installation: publicInstallation(result.id)! };
  },

  authenticate(
    id: string,
    opts?: { kind?: "oauth" | "api_key" | "webhook_secret"; secret?: string },
  ) {
    if (!isIntegrationMarketplaceEnabled()) {
      return { ok: false as const, error: "INTEGRATION_MARKETPLACE disabled" };
    }
    const result = ConnectorManager.authenticate(id, opts);
    if ("error" in result) return { ok: false as const, error: result.error };
    return {
      ok: true as const,
      installation: publicInstallation(result.installation.id)!,
      secret: result.secret,
    };
  },

  enable(id: string) {
    const result = ConnectorManager.setEnabled(id, true);
    if ("error" in result) return { ok: false as const, error: result.error };
    return { ok: true as const, installation: publicInstallation(result.id)! };
  },

  disable(id: string) {
    const result = ConnectorManager.setEnabled(id, false);
    if ("error" in result) return { ok: false as const, error: result.error };
    return { ok: true as const, installation: publicInstallation(result.id)! };
  },

  upgrade(id: string) {
    const result = ConnectorManager.upgrade(id);
    if ("error" in result) return { ok: false as const, error: result.error };
    return { ok: true as const, installation: publicInstallation(result.id)! };
  },

  uninstall(id: string) {
    if (!isIntegrationMarketplaceEnabled()) return false;
    return ConnectorManager.uninstall(id);
  },

  rotateCredentials(installationId: string, credentialId?: string) {
    if (!isIntegrationMarketplaceEnabled()) {
      return { ok: false as const, error: "INTEGRATION_MARKETPLACE disabled" };
    }
    const creds = CredentialManager.list(installationId);
    const target = credentialId
      ? creds.find((c) => c.id === credentialId)
      : creds[0];
    if (!target) return { ok: false as const, error: "No credentials to rotate" };
    const rotated = CredentialManager.rotate(target.id);
    if ("error" in rotated) return { ok: false as const, error: rotated.error };
    return {
      ok: true as const,
      credential: CredentialManager.publicView(rotated.credential),
      secret: rotated.secret,
    };
  },

  health(installationId: string) {
    if (!isConnectorHealthEnabled()) return null;
    return ConnectorHealthService.probe(installationId);
  },

  listHealth(organizationId?: string) {
    if (!isConnectorHealthEnabled()) return [];
    return ConnectorHealthService.list(organizationId);
  },

  async sync(installationId: string) {
    if (!isConnectorRuntimeEnabled()) {
      return { ok: false as const, error: "CONNECTOR_RUNTIME disabled" };
    }
    return ConnectorRuntime.sync(installationId);
  },

  marketplaceHealth() {
    const telemetry = getMarketplaceTelemetrySnapshot();
    return {
      marketplaceEnabled: isIntegrationMarketplaceEnabled(),
      runtimeEnabled: isConnectorRuntimeEnabled(),
      healthEnabled: isConnectorHealthEnabled(),
      modelVersion: INTEGRATION_MARKETPLACE_MODEL_VERSION,
      catalogSize: IntegrationRegistry.count(),
      ...telemetry,
    };
  },
};
