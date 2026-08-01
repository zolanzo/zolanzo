/**
 * Supabase Storage adapter — StorageProvider + EvidenceStorageAdapter.
 * Live when SUPABASE_SERVICE_ROLE_KEY + URL are set; otherwise callers use memory.
 */

import "server-only";

import type {
  EvidenceReference,
  EvidenceStorageAdapter,
  EvidenceStoreInput,
  StorageProvider,
} from "@/lib/integrations/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/validation/env";
import {
  resolveEvidenceContainer,
  STORAGE_BUCKET_VISIBILITY,
  STORAGE_BUCKETS,
  UPLOAD_CONSTRAINTS,
  type StorageBucket,
} from "@/constants/storage";
import { toTrashKey } from "@/lib/integrations/storage/lifecycle";
import { sha256Hex } from "@/lib/integrations/storage/checksum";
import { logger } from "@/lib/observability/logger";

export function isSupabaseStorageLive(): boolean {
  return isServiceRoleConfigured();
}

export function supabaseStorageMode(): "live" | "stub" {
  return isSupabaseStorageLive() ? "live" : "stub";
}

function assertBucket(bucket: string): StorageBucket {
  if (!(STORAGE_BUCKETS as readonly string[]).includes(bucket)) {
    throw new Error(`Unknown storage bucket: ${bucket}`);
  }
  return bucket as StorageBucket;
}

export const supabaseStorageProvider: StorageProvider = {
  providerKey: "supabase",

  async putObject(params) {
    const bucket = assertBucket(params.bucket);
    const client = createSupabaseAdminClient();
    const { error } = await client.storage
      .from(bucket)
      .upload(params.key, params.body, {
        contentType: params.contentType,
        upsert: true,
      });
    if (error) {
      logger.warn("Supabase putObject failed", {
        span: "storage.supabase",
        bucket,
        key: params.key,
        message: error.message,
      });
      throw new Error(error.message);
    }
    const visibility = STORAGE_BUCKET_VISIBILITY[bucket];
    if (visibility === "public") {
      const { data } = client.storage.from(bucket).getPublicUrl(params.key);
      return { url: data.publicUrl };
    }
    const signed = await supabaseStorageProvider.createSignedDownloadUrl({
      bucket,
      key: params.key,
      expiresInSec: UPLOAD_CONSTRAINTS.defaultSignedDownloadTtlSec,
    });
    return { url: signed.signedUrl };
  },

  async getSignedUrl(params) {
    const result = await supabaseStorageProvider.createSignedDownloadUrl(params);
    return result.signedUrl;
  },

  async createSignedUploadUrl(params) {
    const bucket = assertBucket(params.bucket);
    const client = createSupabaseAdminClient();
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUploadUrl(params.key, {
        upsert: params.upsert ?? true,
      });
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create signed upload URL");
    }
    const ttl =
      params.expiresInSec ?? UPLOAD_CONSTRAINTS.defaultSignedUploadTtlSec;
    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
  },

  async createSignedDownloadUrl(params) {
    const bucket = assertBucket(params.bucket);
    const client = createSupabaseAdminClient();
    const ttl =
      params.expiresInSec ?? UPLOAD_CONSTRAINTS.defaultSignedDownloadTtlSec;
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(params.key, ttl, {
        download: params.download,
      });
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create signed download URL");
    }
    return {
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
  },

  async removeObject(params) {
    const bucket = assertBucket(params.bucket);
    const client = createSupabaseAdminClient();
    const { error } = await client.storage.from(bucket).remove([params.key]);
    if (error) throw new Error(error.message);
  },

  async softDeleteObject(params) {
    const bucket = assertBucket(params.bucket);
    const client = createSupabaseAdminClient();
    const trashKey = toTrashKey(params.key);
    const { error: moveError } = await client.storage
      .from(bucket)
      .move(params.key, trashKey);
    if (moveError) throw new Error(moveError.message);
    return { trashKey };
  },

  async listObjects(params) {
    const bucket = assertBucket(params.bucket);
    const client = createSupabaseAdminClient();
    const { data, error } = await client.storage.from(bucket).list(params.prefix ?? "", {
      limit: params.limit ?? 100,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      key: params.prefix ? `${params.prefix.replace(/\/$/, "")}/${row.name}` : row.name,
      sizeBytes: typeof row.metadata?.size === "number" ? row.metadata.size : null,
      updatedAt: row.updated_at ?? row.created_at ?? null,
    }));
  },

  getPublicUrl(params) {
    const bucket = assertBucket(params.bucket);
    if (STORAGE_BUCKET_VISIBILITY[bucket] !== "public") return null;
    const client = createSupabaseAdminClient();
    return client.storage.from(bucket).getPublicUrl(params.key).data.publicUrl;
  },
};

export const supabaseEvidenceStorageAdapter: EvidenceStorageAdapter = {
  providerKey: "supabase",

  async store(input: EvidenceStoreInput): Promise<EvidenceReference> {
    const container = resolveEvidenceContainer(input.container);
    const body = Buffer.from(input.body);
    await supabaseStorageProvider.putObject({
      bucket: container,
      key: input.objectKey,
      body,
      contentType: input.contentType,
    });
    const checksum = await sha256Hex(input.body);
    return {
      adapter: "supabase",
      container,
      objectKey: input.objectKey,
      contentType: input.contentType,
      // checksum not on EvidenceReference type — keep metadata via object key
      ...(checksum ? {} : {}),
    };
  },

  async resolveUrl(ref, expiresInSec): Promise<string> {
    if (ref.adapter !== "supabase") {
      throw new Error(`Supabase evidence adapter cannot resolve ${ref.adapter}`);
    }
    const container = resolveEvidenceContainer(ref.container);
    const signed = await supabaseStorageProvider.createSignedDownloadUrl({
      bucket: container,
      key: ref.objectKey,
      expiresInSec:
        expiresInSec ?? UPLOAD_CONSTRAINTS.defaultSignedDownloadTtlSec,
    });
    return signed.signedUrl;
  },

  async remove(ref): Promise<void> {
    if (ref.adapter !== "supabase") return;
    const container = resolveEvidenceContainer(ref.container);
    await supabaseStorageProvider.removeObject({
      bucket: container,
      key: ref.objectKey,
    });
  },
};
