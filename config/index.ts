/**
 * Unified config surface for the application.
 */

import { APP_CONFIG } from "@/config/app";
import { BRAND_CONFIG } from "@/config/brand";
import {
  ENVIRONMENT_PROFILES,
  resolveAppEnvironment,
  type EnvironmentProfile,
} from "@/config/environments";
import { FEATURE_CONFIG } from "@/config/feature";
import { INFRASTRUCTURE_CONFIG } from "@/config/infrastructure";
import { SECURITY_CONFIG } from "@/config/security";
import { getEnv } from "@/lib/validation/env";

export function getRuntimeConfig() {
  const env = getEnv();
  const stage = resolveAppEnvironment(env.ZOLANZO_ENV);
  const environment: EnvironmentProfile = ENVIRONMENT_PROFILES[stage];

  return {
    app: APP_CONFIG,
    brand: BRAND_CONFIG,
    feature: FEATURE_CONFIG,
    security: SECURITY_CONFIG,
    infrastructure: INFRASTRUCTURE_CONFIG,
    environment,
    stage,
  } as const;
}

export type RuntimeConfig = ReturnType<typeof getRuntimeConfig>;

export {
  APP_CONFIG,
  BRAND_CONFIG,
  FEATURE_CONFIG,
  SECURITY_CONFIG,
  INFRASTRUCTURE_CONFIG,
  ENVIRONMENT_PROFILES,
  resolveAppEnvironment,
};
