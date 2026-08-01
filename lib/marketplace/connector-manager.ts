/**
 * ConnectorManager — lifecycle for installed connectors.
 */

import { getConnector } from "@/lib/marketplace/integration-registry";
import { CredentialManager } from "@/lib/marketplace/credential-manager";
import {
  allocateMarketplaceIds,
  deleteInstallation,
  getInstallation,
  listInstallations,
  saveInstallation,
} from "@/lib/marketplace/store";
import {
  recordMarketplaceInstall,
  setMarketplaceInstallCounts,
} from "@/lib/marketplace/telemetry";
import type {
  ConnectorInstallation,
  ConnectorLifecycleState,
} from "@/lib/marketplace/types";

function syncCounts(): void {
  const all = listInstallations();
  setMarketplaceInstallCounts(
    all.length,
    all.filter((i) => i.enabled && i.lifecycle === "enabled").length,
  );
}

function validateConfig(
  schema: ReturnType<typeof getConnector> extends infer M
    ? M extends { configurationSchema: infer S }
      ? S
      : never
    : never,
  config: Record<string, string | boolean>,
): string | null {
  if (!schema) return "Unknown connector";
  for (const field of schema as Array<{
    key: string;
    required?: boolean;
    type: string;
    enumValues?: string[];
  }>) {
    const value = config[field.key];
    if (field.required && (value === undefined || value === "")) {
      return `Missing required config: ${field.key}`;
    }
    if (value !== undefined && field.type === "boolean" && typeof value !== "boolean") {
      return `Config ${field.key} must be boolean`;
    }
    if (
      value !== undefined &&
      field.type === "enum" &&
      typeof value === "string" &&
      field.enumValues &&
      !field.enumValues.includes(value)
    ) {
      return `Config ${field.key} invalid enum`;
    }
  }
  return null;
}

export function installConnector(input: {
  connectorId: string;
  organizationId: string;
  config?: Record<string, string | boolean>;
}): { installation: ConnectorInstallation } | { error: string } {
  const manifest = getConnector(input.connectorId);
  if (!manifest) return { error: `Unknown connector: ${input.connectorId}` };

  const existing = listInstallations({
    organizationId: input.organizationId,
    connectorId: input.connectorId,
  });
  if (existing.length) {
    return { error: "Connector already installed for organization" };
  }

  const defaults: Record<string, string | boolean> = {};
  for (const f of manifest.configurationSchema) {
    if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
  }
  const config = { ...defaults, ...(input.config ?? {}) };

  const ids = allocateMarketplaceIds();
  const now = new Date().toISOString();
  const installation: ConnectorInstallation = {
    id: ids.installationId,
    publicId: ids.publicId,
    connectorId: manifest.id,
    connectorVersion: manifest.version,
    organizationId: input.organizationId,
    lifecycle: "installed",
    config,
    configVersion: 1,
    enabled: false,
    lastSyncAt: null,
    lastError: null,
    authStatus: "none",
    createdAt: now,
    updatedAt: now,
  };
  saveInstallation(installation);
  recordMarketplaceInstall(manifest.id, manifest.version);
  syncCounts();
  return { installation };
}

export function configureInstallation(
  id: string,
  config: Record<string, string | boolean>,
): ConnectorInstallation | { error: string } {
  const existing = getInstallation(id);
  if (!existing || existing.lifecycle === "uninstalled") {
    return { error: "Installation not found" };
  }
  const manifest = getConnector(existing.connectorId);
  if (!manifest) return { error: "Connector missing from registry" };
  const merged = { ...existing.config, ...config };
  const err = validateConfig(manifest.configurationSchema, merged);
  if (err) return { error: err };

  const next: ConnectorInstallation = {
    ...existing,
    config: merged,
    configVersion: existing.configVersion + 1,
    lifecycle:
      existing.lifecycle === "installed" || existing.lifecycle === "disabled"
        ? "configured"
        : existing.lifecycle,
    updatedAt: new Date().toISOString(),
  };
  saveInstallation(next);
  return next;
}

export function authenticateInstallation(
  id: string,
  opts?: { kind?: "oauth" | "api_key" | "webhook_secret"; secret?: string },
):
  | { installation: ConnectorInstallation; secret?: string }
  | { error: string } {
  const existing = getInstallation(id);
  if (!existing || existing.lifecycle === "uninstalled") {
    return { error: "Installation not found" };
  }
  const manifest = getConnector(existing.connectorId);
  if (!manifest) return { error: "Connector missing from registry" };

  const kind =
    opts?.kind ??
    (manifest.oauthCapable
      ? "oauth"
      : manifest.apiKeyCapable
        ? "api_key"
        : "webhook_secret");

  if (kind === "oauth" && !manifest.oauthCapable) {
    return { error: "Connector does not support OAuth" };
  }
  if (kind === "api_key" && !manifest.apiKeyCapable) {
    return { error: "Connector does not support API keys" };
  }

  const stored = CredentialManager.store({
    installationId: existing.id,
    kind,
    label: `${manifest.name} ${kind}`,
    secret: opts?.secret,
  });

  const next: ConnectorInstallation = {
    ...existing,
    lifecycle: "authenticated",
    authStatus: "ok",
    lastError: null,
    updatedAt: new Date().toISOString(),
  };
  saveInstallation(next);
  return { installation: next, secret: stored.secret };
}

export function setEnabled(
  id: string,
  enabled: boolean,
): ConnectorInstallation | { error: string } {
  const existing = getInstallation(id);
  if (!existing || existing.lifecycle === "uninstalled") {
    return { error: "Installation not found" };
  }
  if (enabled) {
    if (
      existing.lifecycle !== "authenticated" &&
      existing.lifecycle !== "configured" &&
      existing.lifecycle !== "disabled" &&
      existing.lifecycle !== "enabled"
    ) {
      return {
        error: `Cannot enable from lifecycle ${existing.lifecycle}`,
      };
    }
    // Require auth when connector needs credentials
    const manifest = getConnector(existing.connectorId);
    if (
      manifest &&
      (manifest.oauthCapable || manifest.apiKeyCapable) &&
      existing.authStatus !== "ok"
    ) {
      return { error: "Authenticate before enabling" };
    }
  }

  const next: ConnectorInstallation = {
    ...existing,
    enabled,
    lifecycle: enabled ? "enabled" : "disabled",
    updatedAt: new Date().toISOString(),
  };
  saveInstallation(next);
  syncCounts();
  return next;
}

export function upgradeInstallation(
  id: string,
): ConnectorInstallation | { error: string } {
  const existing = getInstallation(id);
  if (!existing || existing.lifecycle === "uninstalled") {
    return { error: "Installation not found" };
  }
  const manifest = getConnector(existing.connectorId);
  if (!manifest) return { error: "Connector missing from registry" };
  if (existing.connectorVersion === manifest.version) {
    return { error: "Already on latest version" };
  }
  const next: ConnectorInstallation = {
    ...existing,
    lifecycle: "upgrading",
    connectorVersion: manifest.version,
    updatedAt: new Date().toISOString(),
  };
  saveInstallation(next);
  const done: ConnectorInstallation = {
    ...next,
    lifecycle: existing.enabled ? "enabled" : "disabled",
    updatedAt: new Date().toISOString(),
  };
  saveInstallation(done);
  recordMarketplaceInstall(manifest.id, manifest.version);
  return done;
}

export function uninstallInstallation(id: string): boolean {
  const existing = getInstallation(id);
  if (!existing) return false;
  for (const c of CredentialManager.list(id)) {
    CredentialManager.revoke(c.id);
  }
  const next: ConnectorInstallation = {
    ...existing,
    enabled: false,
    lifecycle: "uninstalled" as ConnectorLifecycleState,
    updatedAt: new Date().toISOString(),
  };
  saveInstallation(next);
  deleteInstallation(id);
  syncCounts();
  return true;
}

export const ConnectorManager = {
  install: installConnector,
  configure: configureInstallation,
  authenticate: authenticateInstallation,
  setEnabled,
  upgrade: upgradeInstallation,
  uninstall: uninstallInstallation,
  get: getInstallation,
  list: listInstallations,
};
