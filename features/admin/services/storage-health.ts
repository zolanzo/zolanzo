/**
 * Admin Storage Health — capacity + upload/failure signals.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { STORAGE_BUCKETS } from "@/constants/storage";
import {
  getStorageProvider,
  shouldUseLiveSupabaseStorage,
  storageAdapterMode,
} from "@/lib/integrations/storage";
import { isServiceRoleConfigured } from "@/lib/validation/env";

export type StorageHealthSnapshot = {
  providerMode: "live" | "stub";
  providerKey: string;
  keysConfigured: boolean;
  buckets: string[];
  evidenceItems: number;
  uploadsToday: number;
  failures: number;
  largestAssets: Array<{
    id: string;
    sizeBytes: number | null;
    kind: string;
  }>;
  orphanCandidates: number;
  cleanup: {
    lastRunAt: string | null;
    note: string;
  };
  capacityHint: string;
  providerStatus: "ready" | "stub";
  generatedAt: string;
};

export async function getStorageHealthSnapshot(): Promise<StorageHealthSnapshot> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [evidenceItems, uploadsToday, largest, orphanCandidates] =
    await Promise.all([
      prisma.evidenceItem.count(),
      prisma.evidenceItem.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.evidenceItem.findMany({
        where: { sizeBytes: { not: null } },
        orderBy: { sizeBytes: "desc" },
        take: 5,
        select: { id: true, sizeBytes: true, kind: true },
      }),
      // Soft-orphans: evidence items pointing at memory while live supabase is on
      prisma.evidenceItem.count({
        where: {
          replacedAt: null,
          reference: {
            path: ["adapter"],
            equals: "memory",
          },
        },
      }),
    ]);

  const provider = getStorageProvider();
  let listFailures = 0;
  if (shouldUseLiveSupabaseStorage()) {
    try {
      await provider.listObjects({ bucket: "temp-uploads", limit: 1 });
    } catch {
      listFailures = 1;
    }
  }

  return {
    providerMode: storageAdapterMode(),
    providerKey: provider.providerKey,
    keysConfigured: isServiceRoleConfigured(),
    buckets: [...STORAGE_BUCKETS],
    evidenceItems,
    uploadsToday,
    failures: listFailures,
    largestAssets: largest.map((row) => ({
      id: row.id,
      sizeBytes: row.sizeBytes,
      kind: row.kind,
    })),
    orphanCandidates:
      storageAdapterMode() === "live" ? orphanCandidates : 0,
    cleanup: {
      lastRunAt: null,
      note: "storage.cleanup-temp cron every hour at :15",
    },
    capacityHint: "Monitor Supabase Storage dashboard for quota",
    providerStatus: shouldUseLiveSupabaseStorage() ? "ready" : "stub",
    generatedAt: new Date().toISOString(),
  };
}
