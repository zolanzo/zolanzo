/**
 * @deprecated Prefer lib/observability/probes.ts
 * Kept as a thin wrapper for earlier architecture imports.
 */

export {
  getReadinessHealth as getReadinessReport,
  type HealthPayload as HealthReport,
  type ProbeCheck as HealthCheckResult,
} from "@/lib/observability/probes";
