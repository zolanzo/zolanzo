/**
 * Scaling & regional deployment blueprint constants.
 */

export const SCALING_STRATEGIES = [
  "horizontal_app_instances",
  "queue_worker_autoscale",
  "db_connection_pooling",
  "read_replicas",
  "regional_edge_cache",
  "multi_region_storage",
  "future_microservices_split",
] as const;

export const SUGGESTED_REGIONS = [
  "us-east-1",
  "eu-west-1",
  "af-south-1",
] as const;

export const MICROSERVICE_CANDIDATES_FUTURE = [
  "work-engine-worker",
  "finance-ledger-worker",
  "notification-dispatcher",
  "media-processor",
  "search-indexer",
] as const;
