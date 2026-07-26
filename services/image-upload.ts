import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  generateWebPForUpload,
  type OptimizedImageResult,
} from "@/lib/images/optimize";
import { APP_CONFIG } from "@/config/app";

export type UploadImageInput = {
  /** Absolute or project-relative destination path for the original file */
  destinationPath: string;
  /** MIME type of the uploaded file */
  mimeType: string;
  /** Raw file bytes */
  buffer: Buffer;
};

export type UploadImageResult = {
  originalPath: string;
  webp: OptimizedImageResult | null;
};

const RASTER_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

/**
 * Future upload pipeline entrypoint.
 * Persists the original and auto-generates a sibling WebP when enabled.
 */
export async function processImageUpload(
  input: UploadImageInput,
): Promise<UploadImageResult> {
  if (!APP_CONFIG.uploads.allowedMimeTypes.includes(input.mimeType as never)) {
    throw new Error(`Unsupported mime type: ${input.mimeType}`);
  }

  if (input.buffer.byteLength > APP_CONFIG.uploads.maxFileSizeBytes) {
    throw new Error("File exceeds maximum upload size");
  }

  // Caller is responsible for writing the original to destinationPath.
  // This helper focuses on WebP sibling generation.
  let webp: OptimizedImageResult | null = null;

  if (
    APP_CONFIG.uploads.generateWebPOnUpload &&
    RASTER_TYPES.has(input.mimeType)
  ) {
    webp = await generateWebPForUpload(
      input.buffer,
      input.destinationPath,
      { quality: APP_CONFIG.images.defaultQuality },
    );
  }

  return {
    originalPath: input.destinationPath,
    webp,
  };
}

/**
 * Convenience: read a file from disk and generate WebP beside it.
 */
export async function ensureWebPSibling(
  absoluteFilePath: string,
): Promise<OptimizedImageResult> {
  const buffer = await readFile(absoluteFilePath);
  return generateWebPForUpload(buffer, absoluteFilePath, {
    quality: APP_CONFIG.images.defaultQuality,
  });
}

export function resolvePublicUploadPath(...segments: string[]): string {
  return path.join(process.cwd(), "public", "uploads", ...segments);
}
