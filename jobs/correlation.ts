/**
 * Job runners should wrap work with runJobWithContext so logs carry correlation.
 * Retries must pass originalCorrelationId to preserve the trace.
 */

export {
  createJobContext,
  runJobWithContext,
} from "@/lib/observability/request-context";
