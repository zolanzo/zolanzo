/**
 * Storage adapter registry — prefer Supabase when configured and selected.
 */

import type {
  EvidenceStorageAdapter,
  StorageProvider,
} from "@/lib/integrations/types";
import { memoryEvidenceStorageAdapter } from "@/lib/integrations/evidence/memory-adapter";
import { memoryStorageProvider } from "@/lib/integrations/storage/memory-adapter";
import {
  isSupabaseStorageLive,
  supabaseEvidenceStorageAdapter,
  supabaseStorageProvider,
} from "@/lib/integrations/storage/supabase-adapter";
import { integrationRegistry } from "@/lib/integrations/registry";

function preferredStorageProviderKey(): "memory" | "supabase" | "s3" | "gcs" {
  const raw = process.env.STORAGE_PROVIDER?.trim().toLowerCase();
  if (raw === "memory" || raw === "s3" || raw === "gcs" || raw === "supabase") {
    return raw;
  }
  return "supabase";
}

export function shouldUseLiveSupabaseStorage(): boolean {
  return (
    preferredStorageProviderKey() === "supabase" && isSupabaseStorageLive()
  );
}

export function getStorageProvider(): StorageProvider {
  if (integrationRegistry.storage) {
    return integrationRegistry.storage as StorageProvider;
  }
  if (shouldUseLiveSupabaseStorage()) {
    return supabaseStorageProvider;
  }
  return memoryStorageProvider;
}

export function getEvidenceStorageAdapter(): EvidenceStorageAdapter {
  if (shouldUseLiveSupabaseStorage()) {
    return supabaseEvidenceStorageAdapter;
  }
  if (integrationRegistry.evidenceStorage) {
    return integrationRegistry.evidenceStorage;
  }
  return memoryEvidenceStorageAdapter;
}

export function storageAdapterMode(): "live" | "stub" {
  return shouldUseLiveSupabaseStorage() ? "live" : "stub";
}

export {
  memoryStorageProvider,
  clearMemoryStorage,
  peekMemoryObject,
} from "@/lib/integrations/storage/memory-adapter";
export {
  supabaseStorageProvider,
  supabaseEvidenceStorageAdapter,
  isSupabaseStorageLive,
} from "@/lib/integrations/storage/supabase-adapter";
export { validateUpload } from "@/lib/integrations/storage/validation";
export { runVirusScan, setVirusScanHook, noopVirusScanHook } from "@/lib/integrations/storage/virus-scan";
export {
  optimizeImage,
  extractImageMetadata,
  isOptimizableImage,
} from "@/lib/integrations/storage/image";
export {
  toTrashKey,
  isTrashKey,
  isPastTempRetention,
  isPastSoftDeleteRetention,
} from "@/lib/integrations/storage/lifecycle";
export { sha256Hex } from "@/lib/integrations/storage/checksum";
