/**
 * Phase 3B.5 — Storage platform unit tests (memory adapter; no live network).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearMemoryStorage,
  memoryStorageProvider,
  peekMemoryObject,
  runVirusScan,
  setVirusScanHook,
  noopVirusScanHook,
  validateUpload,
  toTrashKey,
  isPastTempRetention,
  sha256Hex,
} from "@/lib/integrations/storage";
import { assertStorageObjectAccess } from "@/features/storage/services/asset-platform";
import { runStorageCleanup } from "@/features/storage/services/cleanup";
import { AppError } from "@/lib/api/response";
import { createSignedUploadSession } from "@/features/storage/services/asset-platform";

beforeEach(() => {
  process.env.STORAGE_PROVIDER = "memory";
});

afterEach(() => {
  clearMemoryStorage();
  setVirusScanHook(noopVirusScanHook);
  delete process.env.STORAGE_PROVIDER;
});

describe("storage validation", () => {
  it("rejects invalid MIME for profile photo", () => {
    const result = validateUpload({
      assetType: "profile_photo",
      contentType: "application/pdf",
      sizeBytes: 1000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("CONTENT_TYPE_REJECTED");
  });

  it("rejects oversized profile photo", () => {
    const result = validateUpload({
      assetType: "profile_photo",
      contentType: "image/png",
      sizeBytes: 20 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FILE_TOO_LARGE");
  });

  it("accepts valid evidence JPEG", () => {
    expect(
      validateUpload({
        assetType: "submission_evidence",
        contentType: "image/jpeg",
        sizeBytes: 1024,
      }).ok,
    ).toBe(true);
  });
});

describe("memory storage provider", () => {
  it("puts, signs, soft-deletes, and lists", async () => {
    const storage = memoryStorageProvider;
    await storage.putObject({
      bucket: "temp-uploads",
      key: "users/u1/file.bin",
      body: Buffer.from("hello"),
      contentType: "application/octet-stream",
    });
    const download = await storage.createSignedDownloadUrl({
      bucket: "temp-uploads",
      key: "users/u1/file.bin",
      expiresInSec: 60,
    });
    expect(download.signedUrl).toContain("memory-signed://");
    expect(new Date(download.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const soft = await storage.softDeleteObject({
      bucket: "temp-uploads",
      key: "users/u1/file.bin",
    });
    expect(soft.trashKey.startsWith(".trash/")).toBe(true);
    expect(peekMemoryObject("temp-uploads", "users/u1/file.bin")).toBeNull();
    expect(peekMemoryObject("temp-uploads", soft.trashKey)).not.toBeNull();
  });

  it("creates signed upload sessions", async () => {
    const session = await createSignedUploadSession({
      actorUserId: "user_1",
      input: {
        assetType: "profile_photo",
        filename: "avatar.png",
        contentType: "image/png",
        sizeBytes: 2048,
      },
    });
    expect(session.ok).toBe(true);
    if (session.ok) {
      expect(session.data.bucket).toBe("avatars");
      expect(session.data.objectKey).toContain("users/user_1/avatar/");
      expect(session.data.token.length).toBeGreaterThan(0);
    }
  });

  it("rejects signed upload with invalid MIME", async () => {
    const session = await createSignedUploadSession({
      actorUserId: "user_1",
      input: {
        assetType: "profile_photo",
        filename: "x.exe",
        contentType: "application/x-msdownload",
        sizeBytes: 100,
      },
    });
    expect(session.ok).toBe(false);
  });
});

describe("access control", () => {
  it("allows owner path and blocks cross-user", () => {
    expect(() =>
      assertStorageObjectAccess({
        bucket: "submission-evidence",
        objectKey: "users/u1/avatar/x.png",
        actorUserId: "u1",
        organizationIds: [],
      }),
    ).not.toThrow();

    expect(() =>
      assertStorageObjectAccess({
        bucket: "submission-evidence",
        objectKey: "users/u2/avatar/x.png",
        actorUserId: "u1",
        organizationIds: [],
      }),
    ).toThrow(AppError);
  });

  it("allows org-scoped paths for members", () => {
    expect(() =>
      assertStorageObjectAccess({
        bucket: "campaign-assets",
        objectKey: "orgs/org_a/campaigns/file.png",
        actorUserId: "u1",
        organizationIds: ["org_a"],
      }),
    ).not.toThrow();
  });
});

describe("virus scan hook", () => {
  it("blocks unclean scans", async () => {
    setVirusScanHook({
      async scan() {
        return { clean: false, engine: "test", details: "malware" };
      },
    });
    const result = await runVirusScan({
      body: new Uint8Array([1]),
      contentType: "image/png",
      objectKey: "x",
      bucket: "avatars",
    });
    expect(result.clean).toBe(false);
  });
});

describe("checksum + cleanup", () => {
  it("hashes stably", async () => {
    const a = await sha256Hex(new TextEncoder().encode("zolanzo"));
    const b = await sha256Hex(new TextEncoder().encode("zolanzo"));
    expect(a).toBe(b);
    expect(a.length).toBe(64);
  });

  it("cleans expired temp uploads", async () => {
    const storage = memoryStorageProvider;
    await storage.putObject({
      bucket: "temp-uploads",
      key: "old.bin",
      body: Buffer.from("old"),
      contentType: "application/octet-stream",
    });
    const obj = peekMemoryObject("temp-uploads", "old.bin");
    expect(obj).not.toBeNull();
    // Backdate
    if (obj) {
      obj.updatedAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    }
    expect(isPastTempRetention(new Date(obj!.updatedAt))).toBe(true);

    const result = await runStorageCleanup({ now: new Date() });
    expect(result.deletedTemp).toBeGreaterThanOrEqual(1);
    expect(peekMemoryObject("temp-uploads", "old.bin")).toBeNull();
  });

  it("uses trash key convention", () => {
    const trash = toTrashKey("users/u1/a.png");
    expect(trash.startsWith(".trash/")).toBe(true);
    expect(trash).toContain("users/u1/a.png");
  });
});
