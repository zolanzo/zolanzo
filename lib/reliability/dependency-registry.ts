/**
 * Central dependency registry for readiness / health aggregation.
 */

export type DependencyHealthStatus = "healthy" | "degraded" | "unavailable";

export type DependencyId =
  | "database"
  | "supabase_auth"
  | "storage"
  | "redis"
  | "queue"
  | "scheduler"
  | "environment";

export type DependencyRecord = {
  id: DependencyId;
  status: DependencyHealthStatus;
  latencyMs: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  detail?: string;
  metadata?: Record<string, unknown>;
};

const DEFAULT_IDS: readonly DependencyId[] = [
  "database",
  "supabase_auth",
  "storage",
  "redis",
  "queue",
  "scheduler",
  "environment",
] as const;

function emptyRecord(id: DependencyId): DependencyRecord {
  return {
    id,
    status: "unavailable",
    latencyMs: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    detail: "not checked yet",
  };
}

class DependencyRegistry {
  private readonly records = new Map<DependencyId, DependencyRecord>();

  constructor() {
    for (const id of DEFAULT_IDS) {
      this.records.set(id, emptyRecord(id));
    }
  }

  list(): DependencyRecord[] {
    return DEFAULT_IDS.map((id) => ({
      ...(this.records.get(id) ?? emptyRecord(id)),
    }));
  }

  get(id: DependencyId): DependencyRecord {
    return { ...(this.records.get(id) ?? emptyRecord(id)) };
  }

  report(params: {
    id: DependencyId;
    status: DependencyHealthStatus;
    latencyMs?: number | null;
    detail?: string;
    metadata?: Record<string, unknown>;
  }): DependencyRecord {
    const prev = this.records.get(params.id) ?? emptyRecord(params.id);
    const now = new Date().toISOString();
    const next: DependencyRecord = {
      id: params.id,
      status: params.status,
      latencyMs: params.latencyMs ?? null,
      lastSuccessAt:
        params.status === "healthy" || params.status === "degraded"
          ? now
          : prev.lastSuccessAt,
      lastFailureAt:
        params.status === "unavailable" ? now : prev.lastFailureAt,
      detail: params.detail,
      metadata: params.metadata,
    };
    // Degraded still counts as a successful check that returned a known state
    if (params.status === "unavailable") {
      next.lastFailureAt = now;
    } else {
      next.lastSuccessAt = now;
    }
    this.records.set(params.id, next);
    return { ...next };
  }

  overall(): DependencyHealthStatus {
    const statuses = this.list().map((r) => r.status);
    if (statuses.some((s) => s === "unavailable")) return "unavailable";
    if (statuses.some((s) => s === "degraded")) return "degraded";
    return "healthy";
  }

  /** Test helper */
  reset(): void {
    this.records.clear();
    for (const id of DEFAULT_IDS) {
      this.records.set(id, emptyRecord(id));
    }
  }
}

export const dependencyRegistry = new DependencyRegistry();

export function probeStatusToDependency(
  status: "ok" | "degraded" | "down",
): DependencyHealthStatus {
  if (status === "ok") return "healthy";
  if (status === "degraded") return "degraded";
  return "unavailable";
}
