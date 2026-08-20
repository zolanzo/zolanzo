/**
 * Builds production-sized AVIF/WebP hero variants from the lady1/lady2 masters.
 *
 * Display width is ~620px on desktop (46% of the 1440px hero grid) and at most
 * 480px below the lg breakpoint. 640w covers 1x; 1280w covers 2x. No 1920w variant.
 *
 * Usage: npx tsx scripts/optimize-hero-images.ts
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "public", "brand");
const MASTER_CANDIDATES = [
  path.join(ROOT, "assets", "brand"),
  path.join(ROOT, "public", "brand"),
];

const SOURCES = ["lady1.png", "lady2.png"] as const;
const WIDTHS = [640, 1280] as const;

type VariantReport = {
  file: string;
  bytes: number;
  width: number;
  height: number;
};

async function findMaster(fileName: string): Promise<string> {
  const { access } = await import("node:fs/promises");
  for (const dir of MASTER_CANDIDATES) {
    const candidate = path.join(dir, fileName);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  throw new Error(`Missing hero master: ${fileName}`);
}

async function writeVariant(
  input: Buffer,
  baseName: string,
  width: number,
): Promise<VariantReport[]> {
  const resized = sharp(input).rotate().resize({
    width,
    withoutEnlargement: true,
  });
  const { height } = await resized.metadata();

  const avifBuffer = await resized.clone().avif({ quality: 58, effort: 6 }).toBuffer();
  const webpBuffer = await resized.clone().webp({ quality: 84, effort: 6 }).toBuffer();

  const avifName = `${baseName}-${width}.avif`;
  const webpName = `${baseName}-${width}.webp`;

  await writeFile(path.join(OUTPUT_DIR, avifName), avifBuffer);
  await writeFile(path.join(OUTPUT_DIR, webpName), webpBuffer);

  return [
    {
      file: avifName,
      bytes: avifBuffer.byteLength,
      width,
      height: height ?? 0,
    },
    {
      file: webpName,
      bytes: webpBuffer.byteLength,
      width,
      height: height ?? 0,
    },
  ];
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const reports: VariantReport[] = [];

  for (const source of SOURCES) {
    const masterPath = await findMaster(source);
    const input = await readFile(masterPath);
    const meta = await sharp(input).metadata();
    const baseName = source.replace(/\.png$/i, "");
    console.log(
      `Master ${source}: ${(input.byteLength / 1024).toFixed(1)} KB, ${meta.width}×${meta.height}`,
    );

    for (const width of WIDTHS) {
      reports.push(...(await writeVariant(input, baseName, width)));
    }
  }

  console.log("\n--- Hero variants ---");
  for (const report of reports) {
    console.log(
      `${report.file.padEnd(22)} ${(report.bytes / 1024).toFixed(1).padStart(7)} KB  ${report.width}×${report.height}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
