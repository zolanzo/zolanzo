/**
 * Health / readiness probe implementations + aggregation.
 */

import { resolveAppEnvironment } from "@/config/environments";
import { prisma } from "@/lib/prisma/client";
import {
  getEnv,
  isDatabaseConfigured,
  isServiceRoleConfigured,
  isSupabaseConfigured,
  loadEnv,
  missingStrictKeysForProbe,
} from "@/lib/validation/env";
import { logger } from "@/lib/observability/logger";
import { getProcessMeta } from "@/lib/observability/process-meta";
import {
  dependencyRegistry,
  probeStatusToDependency,
  type DependencyId,
  type DependencyRecord,
} from "@/lib/reliability/dependency-registry";
import type {
  QueueHealth,
  SchedulerHealth,
} from "@/jobs/runner/types";

export type ProbeStatus = "ok" | "degraded" | "down";

export type ProbeCheck = {
  id: string;
  status: ProbeStatus;
  latencyMs?: number;
  detail?: string;
};

export type HealthPayload = {
  status: ProbeStatus;
  application: string;
  version: string;
  environment: string;
  timestamp: string;
  buildVersion: string;
  gitCommit: string | null;
  startupTime: string;
  uptimeSeconds: number;
  checks: ProbeCheck[];
  dependencies?: DependencyRecord[];
  scheduler?: SchedulerHealth;
  queue?: QueueHealth;
};

function withProcessMeta(
  base: Omit<
    HealthPayload,
    "buildVersion" | "gitCommit" | "startupTime" | "uptimeSeconds"
  >,
): HealthPayload {
  const meta = getProcessMeta();
  return {
    ...base,
    buildVersion: meta.buildVersion,
    gitCommit: meta.gitCommit,
    startupTime: meta.startupTime,
    uptimeSeconds: meta.uptimeSeconds,
  };
}

function aggregateStatus(checks: ProbeCheck[]): ProbeStatus {
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "ok";
}

function recordDependency(
  id: DependencyId,
  check: ProbeCheck,
  metadata?: Record<string, unknown>,
): void {
  dependencyRegistry.report({
    id,
    status: probeStatusToDependency(check.status),
    latencyMs: check.latencyMs ?? null,
    detail: check.detail,
    metadata,
  });
}

export async function getLiveHealth(meta: {
  name: string;
  version: string;
}): Promise<HealthPayload> {
  const env = getEnv();
  return withProcessMeta({
    status: "ok",
    application: meta.name,
    version: meta.version,
    environment: resolveAppEnvironment(env.ZOLANZO_ENV),
    timestamp: new Date().toISOString(),
    checks: [
      {
        id: "app_alive",
        status: "ok",
        detail: "process up",
      },
    ],
  });
}

async function checkDatabase(): Promise<ProbeCheck> {
  if (!isDatabaseConfigured()) {
    return {
      id: "database",
      status: "degraded",
      detail: "DATABASE_URL not configured",
    };
  }

  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      id: "database",
      status: "ok",
      latencyMs: Date.now() - started,
      detail: "connected",
    };
  } catch (error) {
    logger.error("Database readiness check failed", {
      span: "health.database",
      err:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: String(error) },
    });
    return {
      id: "database",
      status: "down",
      latencyMs: Date.now() - started,
      detail: "query failed",
    };
  }
}

async function checkSupabaseAuth(): Promise<ProbeCheck> {
  const env = getEnv();
  if (!isSupabaseConfigured(env)) {
    return {
      id: "supabase_auth",
      status: "degraded",
      detail: "Supabase public credentials not configured",
    };
  }

  const started = Date.now();
  try {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/auth/v1/health`;
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(3_000),
    });
    const latencyMs = Date.now() - started;
    if (res.ok) {
      return {
        id: "supabase_auth",
        status: "ok",
        latencyMs,
        detail: "auth health ok",
      };
    }
    return {
      id: "supabase_auth",
      status: "degraded",
      latencyMs,
      detail: `auth health HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      id: "supabase_auth",
      status: "degraded",
      latencyMs: Date.now() - started,
      detail:
        error instanceof Error
          ? `auth unreachable: ${error.message}`
          : "auth unreachable",
    };
  }
}

async function checkStorage(): Promise<ProbeCheck> {
  const env = getEnv();
  if (!isServiceRoleConfigured(env) && !isSupabaseConfigured(env)) {
    return {
      id: "storage",
      status: "degraded",
      detail: "Supabase storage credentials not configured",
    };
  }

  if (!isServiceRoleConfigured(env)) {
    return {
      id: "storage",
      status: "degraded",
      detail: "service role missing — storage admin probe skipped",
    };
  }

  const started = Date.now();
  try {
    const { createSupabaseAdminClient } = await import(
      "@/lib/supabase/admin"
    );
    const admin = createSupabaseAdminClient();
    const { error } = await admin.storage.listBuckets();
    const latencyMs = Date.now() - started;
    if (error) {
      return {
        id: "storage",
        status: "degraded",
        latencyMs,
        detail: error.message,
      };
    }
    return {
      id: "storage",
      status: "ok",
      latencyMs,
      detail: "storage API reachable",
    };
  } catch (error) {
    return {
      id: "storage",
      status: "degraded",
      latencyMs: Date.now() - started,
      detail:
        error instanceof Error ? error.message : "storage probe failed",
    };
  }
}

async function checkRedis(): Promise<ProbeCheck> {
  const env = getEnv();
  const url = env.REDIS_URL ?? env.RATE_LIMIT_REDIS_URL;
  if (!url) {
    return {
      id: "redis",
      status: "degraded",
      detail: "Redis not configured (optional)",
    };
  }

  const started = Date.now();
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = Number(parsed.port || 6379);
    const net = await import("node:net");
    await new Promise<void>((resolve, reject) => {
      const socket = net.connect({ host, port }, () => {
        socket.end();
        resolve();
      });
      socket.setTimeout(2_000);
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("redis connect timeout"));
      });
      socket.on("error", reject);
    });
    return {
      id: "redis",
      status: "ok",
      latencyMs: Date.now() - started,
      detail: "tcp connect ok",
    };
  } catch (error) {
    return {
      id: "redis",
      status: "down",
      latencyMs: Date.now() - started,
      detail:
        error instanceof Error ? error.message : "redis unreachable",
    };
  }
}

function checkEnvironment(): ProbeCheck {
  try {
    const env = loadEnv();
    const missing = missingStrictKeysForProbe(env);
    if (missing.length > 0) {
      return {
        id: "environment",
        status: "degraded",
        detail: `missing for strict stages: ${missing.join(", ")}`,
      };
    }
    return {
      id: "environment",
      status: "ok",
      detail: resolveAppEnvironment(env.ZOLANZO_ENV),
    };
  } catch (error) {
    return {
      id: "environment",
      status: "down",
      detail:
        error instanceof Error ? error.message : "env validation failed",
    };
  }
}

async function checkScheduler(): Promise<{
  check: ProbeCheck;
  health: SchedulerHealth;
}> {
  const { getCronRunner } = await import("@/jobs/runner/cron-runner");
  const health = getCronRunner().getHealth();
  const check: ProbeCheck = {
    id: "scheduler",
    status: health.status === "running" ? "ok" : "degraded",
    detail: `scheduler ${health.status}; jobs=${health.registeredJobs}; schedules=${health.schedules}`,
  };
  return { check, health };
}

async function checkQueue(): Promise<{
  check: ProbeCheck;
  health: QueueHealth;
}> {
  const { getCronRunner } = await import("@/jobs/runner/cron-runner");
  const health = getCronRunner().getQueueHealth();
  return {
    check: {
      id: "queue",
      status: health.status,
      detail: health.detail,
    },
    health,
  };
}

export async function getReadinessHealth(meta: {
  name: string;
  version: string;
}): Promise<HealthPayload> {
  const env = getEnv();

  const [
    database,
    supabaseAuth,
    storage,
    redis,
    scheduler,
    queue,
  ] = await Promise.all([
    checkDatabase(),
    checkSupabaseAuth(),
    checkStorage(),
    checkRedis(),
    checkScheduler(),
    checkQueue(),
  ]);

  const environment = checkEnvironment();

  const checks: ProbeCheck[] = [
    { id: "app_alive", status: "ok", detail: "process up" },
    environment,
    database,
    supabaseAuth,
    storage,
    redis,
    queue.check,
    scheduler.check,
  ];

  recordDependency("environment", environment);
  recordDependency("database", database);
  recordDependency("supabase_auth", supabaseAuth);
  recordDependency("storage", storage);
  recordDependency("redis", redis);
  recordDependency("queue", queue.check, { backend: queue.health.backend });
  recordDependency("scheduler", scheduler.check, {
    status: scheduler.health.status,
  });

  let status = aggregateStatus(checks);

  // Development without DB is degraded (not down) so local UI still runs.
  if (
    status === "down" &&
    resolveAppEnvironment(env.ZOLANZO_ENV) === "development" &&
    !isDatabaseConfigured(env)
  ) {
    status = "degraded";
  }

  return withProcessMeta({
    status,
    application: meta.name,
    version: meta.version,
    environment: resolveAppEnvironment(env.ZOLANZO_ENV),
    timestamp: new Date().toISOString(),
    checks,
    dependencies: dependencyRegistry.list(),
    scheduler: scheduler.health,
    queue: queue.health,
  });
}
