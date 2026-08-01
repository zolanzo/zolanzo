/**
 * Storage cleanup — temp uploads + expired soft-deleted objects.
 */

import "server-only";

import { STORAGE_BUCKETS, type StorageBucket } from "@/constants/storage";
import { getStorageProvider } from "@/lib/integrations/storage";
import {
  isPastSoftDeleteRetention,
  isPastTempRetention,
  isTrashKey,
  parseTrashDeletedAt,
} from "@/lib/integrations/storage/lifecycle";
import { logger } from "@/lib/observability/logger";

export type StorageCleanupResult = {
  scanned: number;
  deletedTemp: number;
  deletedTrash: number;
  failures: number;
  buckets: StorageBucket[];
};

export async function runStorageCleanup(params?: {
  now?: Date;
  dryRun?: boolean;
}): Promise<StorageCleanupResult> {
  const now = params?.now ?? new Date();
  const dryRun = params?.dryRun ?? false;
  const storage = getStorageProvider();
  const result: StorageCleanupResult = {
    scanned: 0,
    deletedTemp: 0,
    deletedTrash: 0,
    failures: 0,
    buckets: [...STORAGE_BUCKETS],
  };

  for (const bucket of STORAGE_BUCKETS) {
    let objects: Awaited<ReturnType<typeof storage.listObjects>> = [];
    try {
      objects = await storage.listObjects({ bucket, limit: 500 });
    } catch (error) {
      result.failures += 1;
      logger.warn("Storage list failed during cleanup", {
        span: "storage.cleanup",
        bucket,
        err:
          error instanceof Error
            ? { message: error.message }
            : { message: String(error) },
      });
      continue;
    }

    for (const obj of objects) {
      result.scanned += 1;
      try {
        if (isTrashKey(obj.key)) {
          const deletedAt = parseTrashDeletedAt(obj.key);
          if (deletedAt && isPastSoftDeleteRetention(deletedAt, now)) {
            if (!dryRun) {
              await storage.removeObject({ bucket, key: obj.key });
            }
            result.deletedTrash += 1;
          }
          continue;
        }

        if (bucket === "temp-uploads") {
          const updated = obj.updatedAt ? new Date(obj.updatedAt) : null;
          if (updated && isPastTempRetention(updated, now)) {
            if (!dryRun) {
              await storage.removeObject({ bucket, key: obj.key });
            }
            result.deletedTemp += 1;
          }
        }
      } catch (error) {
        result.failures += 1;
        logger.warn("Storage cleanup object failed", {
          span: "storage.cleanup",
          bucket,
          key: obj.key,
          err:
            error instanceof Error
              ? { message: error.message }
              : { message: String(error) },
        });
      }
    }
  }

  logger.info("Storage cleanup complete", {
    span: "storage.cleanup",
    ...result,
    dryRun,
  });

  return result;
}
