/**
 * Monitoring / error-tracking adapter port.
 * Domain and features never import Sentry SDK — only this port.
 */

export type MonitoringSeverity = "fatal" | "error" | "warning" | "info" | "debug";

export type MonitoringEvent = {
  message: string;
  severity?: MonitoringSeverity;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  fingerprint?: string[];
};

export type MonitoringCapability =
  | "error_tracking"
  | "performance"
  | "releases";

export type MonitoringProviderAdapter = {
  readonly providerKey: string;
  readonly capabilities: readonly MonitoringCapability[];
  captureException(event: MonitoringEvent): Promise<{ accepted: boolean; id?: string }>;
  captureMessage(event: MonitoringEvent): Promise<{ accepted: boolean; id?: string }>;
  flush?(timeoutMs?: number): Promise<void>;
};
