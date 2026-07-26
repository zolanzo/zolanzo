/**
 * Platform infrastructure topology — design catalog.
 * No providers connected in Step 7.
 */

export const INFRASTRUCTURE_LAYERS = [
  "edge",
  "cdn",
  "application",
  "data",
  "cache",
  "queue",
  "storage",
  "search",
  "realtime",
  "observability",
  "secrets",
] as const;

export type InfrastructureLayer = (typeof INFRASTRUCTURE_LAYERS)[number];

export const EDGE_SERVICES = [
  "cloudflare_dns",
  "cloudflare_cdn",
  "cloudflare_waf",
  "cloudflare_cache",
  "cloudflare_images",
  "cloudflare_workers_optional",
] as const;

export const DATA_SERVICES = [
  "supabase_postgres",
  "supabase_auth",
  "supabase_storage",
  "supabase_realtime",
  "prisma_orm",
  "read_replicas_future",
] as const;

export const CACHE_SERVICES = [
  "redis_rate_limit",
  "redis_session_optional",
  "redis_job_locks",
  "redis_cache_aside",
] as const;

export const QUEUE_SERVICES = [
  "bullmq_or_inngest",
  "cron_scheduler",
  "event_fanout",
] as const;

export const SEARCH_BACKENDS = [
  "postgres_fts",
  "meilisearch_or_typesense",
  "semantic_embeddings_future",
] as const;

export const APP_ENVIRONMENTS = [
  "development",
  "preview",
  "staging",
  "production",
] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export const DEPLOYMENT_TARGETS = {
  development: "local next dev + local/optional supabase",
  preview: "Vercel preview deployments per PR",
  staging: "staging.zolanzo.com — prod-like data subset",
  production: "zolanzo.com — multi-instance + workers",
} as const satisfies Record<AppEnvironment, string>;

/**
 * Request path (conceptual).
 */
export const REQUEST_PATH = [
  "browser",
  "cloudflare",
  "cdn_edge_cache",
  "nextjs_app",
  "supabase_postgres",
  "redis",
  "background_workers",
  "object_storage",
  "email_sms_push",
  "analytics_monitoring",
  "ai_services",
] as const;
