/**
 * ConnectorRuntime — invokes connectors via Public API + Webhook contracts only.
 * Never imports domain services or repositories.
 */

import { isConnectorRuntimeEnabled } from "@/lib/marketplace/config";
import { getConnector } from "@/lib/marketplace/integration-registry";
import { getInstallation, saveInstallation } from "@/lib/marketplace/store";
import { CredentialManager } from "@/lib/marketplace/credential-manager";
import {
  recordMarketplaceLatency,
  recordMarketplaceSyncFailure,
} from "@/lib/marketplace/telemetry";
import { WebhookService } from "@/lib/webhooks/webhook-service";
import type { WebhookEventType } from "@/lib/webhooks/types";

export type ConnectorInvokeResult = {
  ok: boolean;
  connectorId: string;
  installationId: string;
  usedPublicApi: string[];
  usedWebhooks: string[];
  latencyMs: number;
  message: string;
  detail?: Record<string, unknown>;
};

/**
 * Simulate a connector sync tick:
 * - May create/ensure a webhook subscription (Webhook Platform)
 * - Records which Public API endpoints the connector is allowed to call
 * Never calls internal domain modules.
 */
export async function invokeConnectorSync(
  installationId: string,
): Promise<ConnectorInvokeResult> {
  const started = Date.now();
  if (!isConnectorRuntimeEnabled()) {
    return {
      ok: false,
      connectorId: "",
      installationId,
      usedPublicApi: [],
      usedWebhooks: [],
      latencyMs: 0,
      message: "CONNECTOR_RUNTIME disabled",
    };
  }

  const installation = getInstallation(installationId);
  if (!installation || installation.lifecycle === "uninstalled") {
    return {
      ok: false,
      connectorId: "",
      installationId,
      usedPublicApi: [],
      usedWebhooks: [],
      latencyMs: 0,
      message: "Installation not found",
    };
  }
  if (!installation.enabled || installation.lifecycle !== "enabled") {
    return {
      ok: false,
      connectorId: installation.connectorId,
      installationId,
      usedPublicApi: [],
      usedWebhooks: [],
      latencyMs: Date.now() - started,
      message: "Connector not enabled",
    };
  }

  const manifest = getConnector(installation.connectorId);
  if (!manifest) {
    recordMarketplaceSyncFailure();
    return {
      ok: false,
      connectorId: installation.connectorId,
      installationId,
      usedPublicApi: [],
      usedWebhooks: [],
      latencyMs: Date.now() - started,
      message: "Manifest missing",
    };
  }

  const usedWebhooks: string[] = [];
  const usedPublicApi = [...manifest.supportedApiEndpoints];

  // Communication / automation connectors that need an outbound hook
  const endpointUrl =
    (installation.config.endpointUrl as string | undefined) ??
    (installation.config.zapHookUrl as string | undefined) ??
    (installation.config.scenarioHookUrl as string | undefined) ??
    (installation.config.webhookUrl as string | undefined);

  if (endpointUrl && manifest.supportedWebhooks.length) {
    const events = resolveEventTypes(installation, manifest.supportedWebhooks);
    const existing = WebhookService.listSubscriptions(
      installation.organizationId,
    ).find((s) => s.endpointUrl === endpointUrl);

    if (!existing) {
      const created = WebhookService.createSubscription({
        organizationId: installation.organizationId,
        endpointUrl,
        eventTypes: events,
        enabled: true,
      });
      if (!created.ok) {
        recordMarketplaceSyncFailure();
        const latencyMs = Date.now() - started;
        recordMarketplaceLatency(latencyMs);
        installation.lastError = created.error;
        installation.updatedAt = new Date().toISOString();
        saveInstallation(installation);
        return {
          ok: false,
          connectorId: manifest.id,
          installationId,
          usedPublicApi,
          usedWebhooks,
          latencyMs,
          message: created.error,
        };
      }
      usedWebhooks.push(...events);
    } else {
      usedWebhooks.push(...existing.eventTypes);
    }
  }

  // Credential presence check for OAuth / API key connectors
  const creds = CredentialManager.list(installationId);
  if (
    (manifest.oauthCapable || manifest.apiKeyCapable) &&
    creds.length === 0
  ) {
    recordMarketplaceSyncFailure();
    const latencyMs = Date.now() - started;
    recordMarketplaceLatency(latencyMs);
    return {
      ok: false,
      connectorId: manifest.id,
      installationId,
      usedPublicApi,
      usedWebhooks,
      latencyMs,
      message: "Missing credentials",
    };
  }

  installation.lastSyncAt = new Date().toISOString();
  installation.lastError = null;
  installation.updatedAt = installation.lastSyncAt;
  saveInstallation(installation);

  const latencyMs = Date.now() - started;
  recordMarketplaceLatency(latencyMs);

  return {
    ok: true,
    connectorId: manifest.id,
    installationId,
    usedPublicApi,
    usedWebhooks,
    latencyMs,
    message: "Sync completed via Public API / Webhook contracts",
    detail: {
      isolation: "public_contracts_only",
      scopes: manifest.requiredScopes,
    },
  };
}

function resolveEventTypes(
  installation: { config: Record<string, string | boolean> },
  supported: WebhookEventType[],
): WebhookEventType[] {
  const raw = installation.config.eventTypes;
  if (typeof raw === "string" && raw.trim()) {
    const requested = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as WebhookEventType[];
    const allowed = requested.filter((e) => supported.includes(e));
    if (allowed.length) return allowed;
  }
  return supported.slice(0, 3);
}

export const ConnectorRuntime = {
  sync: invokeConnectorSync,
};
