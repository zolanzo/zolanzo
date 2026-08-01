/**
 * ConnectorHealthService — auth / sync / version health probes.
 */

import { isConnectorHealthEnabled } from "@/lib/marketplace/config";
import { getConnector } from "@/lib/marketplace/integration-registry";
import { CredentialManager } from "@/lib/marketplace/credential-manager";
import { getInstallation, listInstallations } from "@/lib/marketplace/store";
import { recordMarketplaceAuthFailure } from "@/lib/marketplace/telemetry";
import type { ConnectorHealthSnapshot } from "@/lib/marketplace/types";

const failureCounts = new Map<
  string,
  { api: number; webhook: number; rateLimited: number; lastLatency: number | null }
>();

export function recordConnectorApiFailure(installationId: string): void {
  const row = failureCounts.get(installationId) ?? {
    api: 0,
    webhook: 0,
    rateLimited: 0,
    lastLatency: null,
  };
  row.api += 1;
  failureCounts.set(installationId, row);
}

export function recordConnectorWebhookFailure(installationId: string): void {
  const row = failureCounts.get(installationId) ?? {
    api: 0,
    webhook: 0,
    rateLimited: 0,
    lastLatency: null,
  };
  row.webhook += 1;
  failureCounts.set(installationId, row);
}

export function probeInstallationHealth(
  installationId: string,
): ConnectorHealthSnapshot | null {
  if (!isConnectorHealthEnabled()) return null;
  const installation = getInstallation(installationId);
  if (!installation || installation.lifecycle === "uninstalled") return null;
  const manifest = getConnector(installation.connectorId);
  const failures = failureCounts.get(installationId) ?? {
    api: 0,
    webhook: 0,
    rateLimited: 0,
    lastLatency: null,
  };

  let authStatus = installation.authStatus;
  const creds = CredentialManager.list(installationId);
  if (
    manifest &&
    (manifest.oauthCapable || manifest.apiKeyCapable) &&
    creds.length === 0
  ) {
    authStatus = "failed";
    recordMarketplaceAuthFailure();
  }

  const healthy =
    installation.enabled &&
    authStatus !== "failed" &&
    authStatus !== "expired" &&
    failures.api < 5 &&
    failures.webhook < 5;

  return {
    installationId,
    connectorId: installation.connectorId,
    authStatus,
    lastSyncAt: installation.lastSyncAt,
    apiFailures: failures.api,
    webhookFailures: failures.webhook,
    rateLimited: failures.rateLimited,
    version: installation.connectorVersion,
    latencyMs: failures.lastLatency,
    healthy,
  };
}

export function listInstallationHealth(organizationId?: string): ConnectorHealthSnapshot[] {
  return listInstallations(
    organizationId ? { organizationId } : undefined,
  )
    .map((i) => probeInstallationHealth(i.id))
    .filter((h): h is ConnectorHealthSnapshot => h != null);
}

export function resetConnectorHealthForTests(): void {
  failureCounts.clear();
}

export const ConnectorHealthService = {
  probe: probeInstallationHealth,
  list: listInstallationHealth,
  recordApiFailure: recordConnectorApiFailure,
  recordWebhookFailure: recordConnectorWebhookFailure,
};
