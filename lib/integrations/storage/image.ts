/**
 * Image optimization + thumbnail generation (sharp).
 * Adapter-adjacent utility — never called from browser.
 */

import "server-only";

import sharp from "sharp";
import { UPLOAD_CONSTRAINTS } from "@/constants/storage";

export type ImageOptimizeResult = {
  webp: Uint8Array;
  thumbnail: Uint8Array;
  width: number;
  height: number;
  format: string;
};

export async function extractImageMetadata(
  body: Uint8Array,
): Promise<{ width: number; height: number; format: string }> {
  const meta = await sharp(body).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? "unknown",
  };
}

export async function optimizeImage(
  body: Uint8Array,
): Promise<ImageOptimizeResult> {
  const image = sharp(body);
  const meta = await image.metadata();
  const edge = UPLOAD_CONSTRAINTS.thumbnailMaxEdgePx;

  const webp = await sharp(body).webp({ quality: 82 }).toBuffer();
  const thumbnail = await sharp(body)
    .resize({
      width: edge,
      height: edge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toBuffer();

  return {
    webp: new Uint8Array(webp),
    thumbnail: new Uint8Array(thumbnail),
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? "unknown",
  };
}

export function isOptimizableImage(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return (
    ct === "image/jpeg" ||
    ct === "image/png" ||
    ct === "image/webp" ||
    ct === "image/gif"
  );
}
