/**
 * In-memory StorageProvider — local/tests until Supabase is keyed.
 */

import type { StorageProvider } from "@/lib/integrations/types";
import { toTrashKey } from "@/lib/integrations/storage/lifecycle";
import { sha256Hex } from "@/lib/integrations/storage/checksum";
import { UPLOAD_CONSTRAINTS } from "@/constants/storage";

type MemObject = {
  body: Uint8Array;
  contentType: string;
  updatedAt: string;
};

const objects = new Map<string, MemObject>();

function mapKey(bucket: string, key: string): string {
  return `${bucket}::${key}`;
}

export const memoryStorageProvider: StorageProvider = {
  providerKey: "memory",

  async putObject(params) {
    const checksum = await sha256Hex(params.body);
    objects.set(mapKey(params.bucket, params.key), {
      body: new Uint8Array(params.body),
      contentType: params.contentType,
      updatedAt: new Date().toISOString(),
    });
    return {
      url: `/storage/${params.bucket}/${params.key}`,
      checksumSha256: checksum,
    } as { url: string };
  },

  async getSignedUrl(params) {
    const found = objects.get(mapKey(params.bucket, params.key));
    if (!found) throw new Error(`Object not found: ${params.bucket}/${params.key}`);
    return `memory-signed://${params.bucket}/${params.key}?exp=${params.expiresInSec}`;
  },

  async createSignedUploadUrl(params) {
    const ttl =
      params.expiresInSec ?? UPLOAD_CONSTRAINTS.defaultSignedUploadTtlSec;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    return {
      signedUrl: `memory-upload://${params.bucket}/${params.key}?token=mem`,
      token: `mem_${params.key}`,
      path: params.key,
      expiresAt,
    };
  },

  async createSignedDownloadUrl(params) {
    const ttl =
      params.expiresInSec ?? UPLOAD_CONSTRAINTS.defaultSignedDownloadTtlSec;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    const signedUrl = await memoryStorageProvider.getSignedUrl({
      bucket: params.bucket,
      key: params.key,
      expiresInSec: ttl,
    });
    return { signedUrl, expiresAt };
  },

  async removeObject(params) {
    objects.delete(mapKey(params.bucket, params.key));
  },

  async softDeleteObject(params) {
    const existing = objects.get(mapKey(params.bucket, params.key));
    if (!existing) throw new Error(`Object not found: ${params.key}`);
    const trashKey = toTrashKey(params.key);
    objects.set(mapKey(params.bucket, trashKey), existing);
    objects.delete(mapKey(params.bucket, params.key));
    return { trashKey };
  },

  async listObjects(params) {
    const out: Array<{
      key: string;
      sizeBytes: number | null;
      updatedAt: string | null;
    }> = [];
    for (const [k, v] of objects.entries()) {
      if (!k.startsWith(`${params.bucket}::`)) continue;
      const key = k.slice(params.bucket.length + 2);
      if (params.prefix && !key.startsWith(params.prefix)) continue;
      out.push({
        key,
        sizeBytes: v.body.byteLength,
        updatedAt: v.updatedAt,
      });
      if (params.limit && out.length >= params.limit) break;
    }
    return out;
  },

  getPublicUrl(params) {
    return `/storage/${params.bucket}/${params.key}`;
  },
};

/** Test helper */
export function clearMemoryStorage(): void {
  objects.clear();
}

/** Read raw bytes (tests / cleanup). */
export function peekMemoryObject(
  bucket: string,
  key: string,
): MemObject | null {
  return objects.get(mapKey(bucket, key)) ?? null;
}
