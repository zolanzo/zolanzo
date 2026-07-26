/**
 * Infrastructure configuration (non-secret topology hints).
 */

import {
  CACHE_SERVICES,
  DATA_SERVICES,
  DEPLOYMENT_TARGETS,
  EDGE_SERVICES,
  QUEUE_SERVICES,
  REQUEST_PATH,
} from "@/constants/infrastructure";
import { STORAGE_BUCKETS, UPLOAD_CONSTRAINTS } from "@/constants/storage";

export const INFRASTRUCTURE_CONFIG = {
  edge: EDGE_SERVICES,
  data: DATA_SERVICES,
  cache: CACHE_SERVICES,
  queue: QUEUE_SERVICES,
  requestPath: REQUEST_PATH,
  deploymentTargets: DEPLOYMENT_TARGETS,
  storage: {
    buckets: STORAGE_BUCKETS,
    uploads: UPLOAD_CONSTRAINTS,
  },
  health: {
    livePath: "/health",
    readyPath: "/readiness",
    versionPath: "/version",
  },
} as const;

export type InfrastructureConfig = typeof INFRASTRUCTURE_CONFIG;
