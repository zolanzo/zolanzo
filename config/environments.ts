/**
 * Environment management — non-secret config per stage.
 */

import type { AppEnvironment } from "@/constants/infrastructure";

export type EnvironmentProfile = {
  name: AppEnvironment;
  allowDestructiveJobs: boolean;
  requireMfaForAdmin: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  multiInstance: boolean;
};

export const ENVIRONMENT_PROFILES: Record<AppEnvironment, EnvironmentProfile> =
  {
    development: {
      name: "development",
      allowDestructiveJobs: true,
      requireMfaForAdmin: false,
      logLevel: "debug",
      multiInstance: false,
    },
    preview: {
      name: "preview",
      allowDestructiveJobs: false,
      requireMfaForAdmin: false,
      logLevel: "info",
      multiInstance: false,
    },
    staging: {
      name: "staging",
      allowDestructiveJobs: false,
      requireMfaForAdmin: true,
      logLevel: "info",
      multiInstance: true,
    },
    production: {
      name: "production",
      allowDestructiveJobs: false,
      requireMfaForAdmin: true,
      logLevel: "info",
      multiInstance: true,
    },
  };

export function resolveAppEnvironment(
  value: string | undefined = process.env.ZOLANZO_ENV ?? process.env.NODE_ENV,
): AppEnvironment {
  if (value === "production") return "production";
  if (value === "staging") return "staging";
  if (value === "preview") return "preview";
  return "development";
}
