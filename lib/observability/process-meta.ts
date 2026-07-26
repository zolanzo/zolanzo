/**
 * Process startup metadata for health endpoints.
 */

import packageJson from "@/package.json";

const STARTUP_MS = Date.now();
const STARTUP_ISO = new Date(STARTUP_MS).toISOString();

export function getBuildVersion(): string {
  return packageJson.version;
}

export function getGitCommit(): string | null {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT ??
    process.env.COMMIT_SHA ??
    process.env.SOURCE_VERSION ??
    null
  );
}

export function getStartupTime(): string {
  return STARTUP_ISO;
}

/** Alias for health docs / tests */
export function getStartupTimeIso(): string {
  return getStartupTime();
}

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - STARTUP_MS) / 1000);
}

export function getProcessMeta(): {
  buildVersion: string;
  gitCommit: string | null;
  startupTime: string;
  uptimeSeconds: number;
} {
  return {
    buildVersion: getBuildVersion(),
    gitCommit: getGitCommit(),
    startupTime: getStartupTime(),
    uptimeSeconds: getUptimeSeconds(),
  };
}
