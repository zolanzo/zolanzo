/**
 * Scheduler locking — prevent duplicate cron execution.
 *
 * Assumptions (documented):
 * - Preferred: Postgres session advisory lock when DATABASE_URL is configured.
 * - Fallback: in-process mutex (safe for a single Node process only).
 * - True multi-instance Redis / etcd locking is deferred (Phase 3A+).
 */

import { isDatabaseConfigured } from "@/lib/validation/env";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("scheduler.lock");

const localLocks = new Map<string, Promise<void>>();

/** Deterministic 32-bit key space for pg_advisory_lock */
export function advisoryLockKey(name: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // signed 32-bit for Postgres int4
  return hash | 0;
}

async function tryPgLock(key: number): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma/client");
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${key}) AS locked
  `;
  return Boolean(rows[0]?.locked);
}

async function releasePgLock(key: number): Promise<void> {
  const { prisma } = await import("@/lib/prisma/client");
  await prisma.$queryRaw`SELECT pg_advisory_unlock(${key})`;
}

export type LockMode = "postgres" | "in_process";

export async function withSchedulerLock<T>(
  lockName: string,
  fn: () => Promise<T>,
): Promise<{ ran: boolean; result?: T; mode: LockMode }> {
  const usePg = isDatabaseConfigured();

  if (usePg) {
    const key = advisoryLockKey(`zolanzo:cron:${lockName}`);
    let locked = false;
    try {
      locked = await tryPgLock(key);
    } catch (error) {
      log.warn("Postgres advisory lock failed; falling back to in-process", {
        lockName,
        err:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { message: String(error) },
      });
      return withInProcessLock(lockName, fn);
    }

    if (!locked) {
      return { ran: false, mode: "postgres" };
    }

    try {
      const result = await fn();
      return { ran: true, result, mode: "postgres" };
    } finally {
      try {
        await releasePgLock(key);
      } catch (error) {
        log.warn("Failed to release advisory lock", {
          lockName,
          err:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { message: String(error) },
        });
      }
    }
  }

  return withInProcessLock(lockName, fn);
}

async function withInProcessLock<T>(
  lockName: string,
  fn: () => Promise<T>,
): Promise<{ ran: boolean; result?: T; mode: LockMode }> {
  if (localLocks.has(lockName)) {
    return { ran: false, mode: "in_process" };
  }

  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  localLocks.set(lockName, gate);

  try {
    const result = await fn();
    return { ran: true, result, mode: "in_process" };
  } finally {
    localLocks.delete(lockName);
    release();
  }
}
