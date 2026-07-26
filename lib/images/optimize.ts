import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type ImageFormat = "webp" | "avif" | "jpeg" | "png";

export type OptimizeImageOptions = {
  /** Output quality 1–100 */
  quality?: number;
  /** Max width; height scales proportionally */
  maxWidth?: number;
  /** Additional formats to emit alongside WebP */
  formats?: ImageFormat[];
};

export type OptimizedImageResult = {
  webpPath: string;
  webpSize: number;
  originalSize: number;
  savingsPercent: number;
  width: number;
  height: number;
};

const DEFAULT_QUALITY = 82;

/**
 * Converts a PNG/JPG buffer to optimized WebP (and optional extras).
 * Used by brand conversion scripts and future upload pipelines.
 */
export async function optimizeToWebP(
  input: Buffer,
  outputWebpPath: string,
  options: OptimizeImageOptions = {},
): Promise<OptimizedImageResult> {
  const quality = options.quality ?? DEFAULT_QUALITY;
  let pipeline = sharp(input).rotate();

  if (options.maxWidth) {
    pipeline = pipeline.resize({
      width: options.maxWidth,
      withoutEnlargement: true,
    });
  }

  const metadata = await pipeline.metadata();
  const webpBuffer = await pipeline
    .clone()
    .webp({ quality, effort: 6 })
    .toBuffer();

  await mkdir(path.dirname(outputWebpPath), { recursive: true });
  await writeFile(outputWebpPath, webpBuffer);

  const formats = options.formats ?? [];
  for (const format of formats) {
    if (format === "webp") continue;
    const ext = format === "jpeg" ? "jpg" : format;
    const outPath = outputWebpPath.replace(/\.webp$/i, `.${ext}`);
    let fmtPipeline = sharp(input).rotate();
    if (options.maxWidth) {
      fmtPipeline = fmtPipeline.resize({
        width: options.maxWidth,
        withoutEnlargement: true,
      });
    }
    if (format === "avif") {
      await writeFile(
        outPath,
        await fmtPipeline.avif({ quality }).toBuffer(),
      );
    } else if (format === "jpeg") {
      await writeFile(
        outPath,
        await fmtPipeline.jpeg({ quality, mozjpeg: true }).toBuffer(),
      );
    } else if (format === "png") {
      await writeFile(outPath, await fmtPipeline.png({ compressionLevel: 9 }).toBuffer());
    }
  }

  const originalSize = input.byteLength;
  const webpSize = webpBuffer.byteLength;
  const savingsPercent =
    originalSize > 0
      ? Math.round(((originalSize - webpSize) / originalSize) * 1000) / 10
      : 0;

  return {
    webpPath: outputWebpPath,
    webpSize,
    originalSize,
    savingsPercent,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

/**
 * Upload helper: given an uploaded PNG/JPG, write WebP sibling
 * next to the destination path (foo.png → foo.webp).
 */
export async function generateWebPForUpload(
  fileBuffer: Buffer,
  destinationPath: string,
  options?: OptimizeImageOptions,
): Promise<OptimizedImageResult> {
  const parsed = path.parse(destinationPath);
  const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);
  return optimizeToWebP(fileBuffer, webpPath, options);
}

/**
 * Tiny base64 blur placeholder for next/image blurDataURL.
 */
export async function createBlurPlaceholder(
  input: Buffer,
  size = 16,
): Promise<string> {
  const buffer = await sharp(input)
    .resize(size, size, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString("base64")}`;
}
