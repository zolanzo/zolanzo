/**
 * Infrastructure verification — DB, storage, email, payments, engines, Public API.
 * Avoids importing `server-only` modules (Prisma) so the CLI can run under tsx.
 */

import { providerKeysPresent, pathContract, INFRA_SURFACES } from "@/verification/surfaces";
import type { VerifyCheck, VerifyStatus } from "@/verification/types";
import { isDatabaseConfigured } from "@/lib/validation/env";

function check(
  id: string,
  name: string,
  status: VerifyStatus,
  durationMs: number,
  evidence: string,
  notes?: string,
): VerifyCheck {
  return {
    id,
    name,
    category: "infrastructure",
    status,
    durationMs,
    evidence,
    notes,
  };
}

async function probeDatabase(): Promise<VerifyCheck> {
  const started = Date.now();
  if (!isDatabaseConfigured()) {
    return check(
      "infra.database",
      "Database",
      "blocked",
      Date.now() - started,
      "DATABASE_URL not configured",
      "Live Prisma write verification requires staging credentials",
    );
  }

  try {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3_000,
      query_timeout: 3_000,
    });
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return check(
      "infra.database",
      "Database",
      "pass",
      Date.now() - started,
      "SELECT 1 ok via pg (CLI probe)",
      "Live Prisma write verification requires staging credentials",
    );
  } catch (error) {
    return check(
      "infra.database",
      "Database",
      "blocked",
      Date.now() - started,
      error instanceof Error ? error.message : "database unreachable",
      "Live Prisma write verification requires staging credentials",
    );
  }
}

async function probeStorageConfig(): Promise<VerifyCheck> {
  const started = Date.now();
  const surface = pathContract(INFRA_SURFACES.storage);
  if (!surface.ok) {
    return check(
      "infra.storage",
      "Storage",
      "fail",
      Date.now() - started,
      `Missing: ${surface.missing.join(", ")}`,
    );
  }
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  if (hasServiceRole && hasUrl) {
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
      const res = await fetch(`${base}/storage/v1/bucket`, {
        method: "GET",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        signal: AbortSignal.timeout(3_000),
      });
      if (res.ok) {
        return check(
          "infra.storage",
          "Storage",
          "pass",
          Date.now() - started,
          `Storage API HTTP ${res.status}`,
        );
      }
      return check(
        "infra.storage",
        "Storage",
        "warn",
        Date.now() - started,
        `Storage API HTTP ${res.status}`,
      );
    } catch (error) {
      return check(
        "infra.storage",
        "Storage",
        "warn",
        Date.now() - started,
        error instanceof Error ? error.message : "storage unreachable",
      );
    }
  }
  return check(
    "infra.storage",
    "Storage",
    "warn",
    Date.now() - started,
    "Storage adapters present; service role / URL incomplete for live probe",
  );
}

async function verifyPublicApi(): Promise<VerifyCheck> {
  const started = Date.now();
  const surface = pathContract(INFRA_SURFACES.publicApi);
  if (!surface.ok) {
    return check(
      "infra.public_api",
      "Public API",
      "fail",
      Date.now() - started,
      `Missing: ${surface.missing.join(", ")}`,
    );
  }
  try {
    const {
      createApiKey,
      handlePublicApiRequest,
      resetApiKeyStoreForTests,
      resetIdempotencyStoreForTests,
      resetPublicApiTelemetryForTests,
      resetPublicApiAuditForTests,
    } = await import("@/lib/public-api");
    resetApiKeyStoreForTests();
    resetIdempotencyStoreForTests();
    resetPublicApiTelemetryForTests();
    resetPublicApiAuditForTests();
    const { secret } = createApiKey({
      name: "verify",
      organizationId: "ORG-VERIFY",
      scopes: ["campaigns.read"],
    });
    const res = await handlePublicApiRequest({
      method: "GET",
      path: "/campaigns",
      headers: new Headers({ "X-Api-Key": secret }),
      query: new URLSearchParams({ limit: "5" }),
    });
    if (res.status !== 200) {
      return check(
        "infra.public_api",
        "Public API",
        "fail",
        Date.now() - started,
        `GET /campaigns status=${res.status}`,
      );
    }
    return check(
      "infra.public_api",
      "Public API",
      "pass",
      Date.now() - started,
      "GET /api/v1/campaigns authenticated via API key",
    );
  } catch (error) {
    return check(
      "infra.public_api",
      "Public API",
      "fail",
      Date.now() - started,
      error instanceof Error ? error.message : "public api failed",
    );
  }
}

export async function runInfrastructureVerification(): Promise<{
  checks: VerifyCheck[];
  databaseReachable: boolean;
}> {
  const keys = providerKeysPresent();
  const [database, storage, publicApi] = await Promise.all([
    probeDatabase(),
    probeStorageConfig(),
    verifyPublicApi(),
  ]);

  const checks: VerifyCheck[] = [
    database,
    storage,
    check(
      "infra.email",
      "Email",
      !pathContract(INFRA_SURFACES.email).ok
        ? "fail"
        : keys.resend
          ? "pass"
          : "warn",
      0,
      keys.resend
        ? "Resend key present · notification hub + Resend webhook route"
        : "Resend key absent — email path contract only",
      keys.resend
        ? undefined
        : "Configure RESEND_API_KEY for live email delivery smoke",
    ),
    check(
      "infra.payments",
      "Payments",
      !pathContract(INFRA_SURFACES.payments).ok
        ? "fail"
        : keys.paystack
          ? "pass"
          : "warn",
      0,
      keys.paystack
        ? "Paystack key present · payment platform + webhook route"
        : "Paystack key absent — payment path contract only",
      keys.paystack
        ? undefined
        : "Configure PAYSTACK_SECRET_KEY for live payment smoke",
    ),
    check(
      "infra.sms",
      "SMS",
      !pathContract(INFRA_SURFACES.sms).ok
        ? "fail"
        : keys.sendchamp
          ? "pass"
          : "warn",
      0,
      keys.sendchamp
        ? "Sendchamp key present · SMS channel active"
        : "Sendchamp key absent — Sendchamp SMS path contract only",
    ),
    check(
      "infra.whatsapp",
      "WhatsApp",
      !pathContract(INFRA_SURFACES.whatsapp).ok
        ? "fail"
        : keys.sendchamp
          ? "pass"
          : "warn",
      0,
      keys.sendchamp
        ? "Sendchamp key present · WhatsApp channel active"
        : "Sendchamp key absent — Sendchamp WhatsApp path contract only",
    ),
    check(
      "infra.ai_services",
      "AI Services",
      pathContract(INFRA_SURFACES.aiServices).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.aiServices).ok
        ? "AI Foundation surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.aiServices).missing.join(", ")}`,
    ),
    check(
      "infra.trust_engine",
      "Trust Engine",
      pathContract(INFRA_SURFACES.trustEngine).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.trustEngine).ok
        ? "TrustEngine surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.trustEngine).missing.join(", ")}`,
    ),
    check(
      "infra.forecast_engine",
      "Forecast Engine",
      pathContract(INFRA_SURFACES.forecastEngine).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.forecastEngine).ok
        ? "ForecastEngine surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.forecastEngine).missing.join(", ")}`,
    ),
    check(
      "infra.automation_engine",
      "Automation Engine",
      pathContract(INFRA_SURFACES.automationEngine).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.automationEngine).ok
        ? "AutomationEngine surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.automationEngine).missing.join(", ")}`,
    ),
    check(
      "infra.forecasts",
      "Forecasts",
      pathContract(INFRA_SURFACES.forecasts).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.forecasts).ok
        ? "ForecastService surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.forecasts).missing.join(", ")}`,
    ),
    check(
      "infra.reports",
      "Reports",
      pathContract(INFRA_SURFACES.reports).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.reports).ok
        ? "ReportService surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.reports).missing.join(", ")}`,
    ),
    check(
      "infra.automation",
      "Automation",
      pathContract(INFRA_SURFACES.automation).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.automation).ok
        ? "AutomationService surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.automation).missing.join(", ")}`,
    ),
    publicApi,
    check(
      "infra.webhooks",
      "Webhooks",
      pathContract(INFRA_SURFACES.webhooks).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.webhooks).ok
        ? "WebhookService surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.webhooks).missing.join(", ")}`,
    ),
    check(
      "infra.connectors",
      "Connectors",
      pathContract(INFRA_SURFACES.connectors).ok ? "pass" : "fail",
      0,
      pathContract(INFRA_SURFACES.connectors).ok
        ? "ConnectorRuntime surface present"
        : `Missing: ${pathContract(INFRA_SURFACES.connectors).missing.join(", ")}`,
    ),
  ];

  return {
    checks,
    databaseReachable: database.status === "pass",
  };
}
