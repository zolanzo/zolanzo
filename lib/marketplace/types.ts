/**
 * Integration Marketplace — Phase 4.5C types.
 * Connectors use Public API + Webhooks only — never internal services.
 */

import type { PublicApiScope } from "@/lib/public-api/types";
import type { WebhookEventType } from "@/lib/webhooks/types";

export const INTEGRATION_MARKETPLACE_MODEL_VERSION =
  "integration-marketplace/1.0.0";

export const CONNECTOR_CATEGORIES = [
  "communication",
  "productivity",
  "automation",
  "hr",
  "finance",
] as const;

export type ConnectorCategory = (typeof CONNECTOR_CATEGORIES)[number];

export const CONNECTOR_LIFECYCLE_STATES = [
  "available",
  "installed",
  "configured",
  "authenticated",
  "enabled",
  "disabled",
  "upgrading",
  "uninstalled",
] as const;

export type ConnectorLifecycleState =
  (typeof CONNECTOR_LIFECYCLE_STATES)[number];

export type ConfigFieldSchema = {
  key: string;
  label: string;
  type: "string" | "url" | "boolean" | "enum" | "secret";
  required?: boolean;
  enumValues?: string[];
  description?: string;
  defaultValue?: string | boolean;
};

export type ConnectorManifest = {
  id: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  version: string;
  requiredScopes: PublicApiScope[];
  supportedWebhooks: WebhookEventType[];
  supportedApiEndpoints: string[];
  configurationSchema: ConfigFieldSchema[];
  healthChecks: string[];
  oauthCapable: boolean;
  apiKeyCapable: boolean;
};

export type CredentialKind = "oauth" | "api_key" | "webhook_secret";

export type StoredCredential = {
  id: string;
  installationId: string;
  kind: CredentialKind;
  /** Encrypted / hashed payload — never return raw in list APIs */
  secretHash: string;
  label: string;
  createdAt: string;
  rotatedAt: string | null;
  revokedAt: string | null;
};

export type ConnectorInstallation = {
  id: string;
  publicId: string;
  connectorId: string;
  connectorVersion: string;
  organizationId: string;
  lifecycle: ConnectorLifecycleState;
  config: Record<string, string | boolean>;
  configVersion: number;
  enabled: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  authStatus: "none" | "ok" | "failed" | "expired";
  createdAt: string;
  updatedAt: string;
};

export type ConnectorHealthSnapshot = {
  installationId: string;
  connectorId: string;
  authStatus: ConnectorInstallation["authStatus"];
  lastSyncAt: string | null;
  apiFailures: number;
  webhookFailures: number;
  rateLimited: number;
  version: string;
  latencyMs: number | null;
  healthy: boolean;
};

export type MarketplaceHealthCounters = {
  installed: number;
  active: number;
  authFailures: number;
  syncFailures: number;
  totalLatencyMs: number;
  latencySamples: number;
  byConnector: Record<string, number>;
  byVersion: Record<string, number>;
};
