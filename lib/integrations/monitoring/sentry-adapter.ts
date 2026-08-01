/**
 * Sentry monitoring adapter — stub + optional HTTP envelope when SENTRY_DSN set.
 * No @sentry/* SDK dependency (Phase 3B may swap to official SDK).
 */

import type {
  MonitoringEvent,
  MonitoringProviderAdapter,
} from "@/lib/integrations/monitoring/types";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("monitoring.sentry");

function parseDsn(dsn: string): {
  publicKey: string;
  host: string;
  projectId: string;
} | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, "").split("/")[0];
    if (!publicKey || !projectId) return null;
    return { publicKey, host: url.host, projectId };
  } catch {
    return null;
  }
}

export const sentryMonitoringAdapter: MonitoringProviderAdapter = {
  providerKey: "sentry",
  capabilities: ["error_tracking", "performance", "releases"],

  async captureException(event) {
    return send(event, "error");
  },

  async captureMessage(event) {
    return send(event, event.severity ?? "info");
  },
};

async function send(
  event: MonitoringEvent,
  level: string,
): Promise<{ accepted: boolean; id?: string }> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    log.debug("Sentry DSN unset — event retained as stub only", {
      span: "monitoring.sentry",
      message: event.message,
      level,
      correlationId: event.correlationId,
    });
    return { accepted: false };
  }

  const parsed = parseDsn(dsn);
  if (!parsed) {
    log.warn("Invalid SENTRY_DSN", { span: "monitoring.sentry" });
    return { accepted: false };
  }

  const eventId = crypto.randomUUID().replace(/-/g, "");
  const payload = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level,
    message: event.message,
    exception: event.error
      ? {
          values: [
            {
              type: event.error.name ?? "Error",
              value: event.error.message,
              stacktrace: event.error.stack
                ? { frames: [{ filename: "app", function: event.error.stack }] }
                : undefined,
            },
          ],
        }
      : undefined,
    tags: {
      ...event.tags,
      ...(event.correlationId
        ? { correlationId: event.correlationId }
        : {}),
    },
    extra: {
      ...event.extras,
      requestId: event.requestId,
      userId: event.userId,
      organizationId: event.organizationId,
    },
    user: event.userId ? { id: event.userId } : undefined,
    fingerprint: event.fingerprint,
  };

  try {
    const endpoint = `https://${parsed.host}/api/${parsed.projectId}/store/`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=zolanzo-monitoring/1.0`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) {
      log.warn("Sentry store rejected event", {
        span: "monitoring.sentry",
        status: res.status,
        correlationId: event.correlationId,
      });
      return { accepted: false, id: eventId };
    }
    return { accepted: true, id: eventId };
  } catch (error) {
    log.warn("Sentry store failed", {
      span: "monitoring.sentry",
      err:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: String(error) },
      correlationId: event.correlationId,
    });
    return { accepted: false, id: eventId };
  }
}
