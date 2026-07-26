/**
 * Converts all PNG brand assets in /public/brand to optimized WebP.
 * Keeps PNG originals intact.
 *
 * Usage: npx tsx scripts/convert-brand-webp.ts
 */

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { optimizeToWebP } from "../lib/images/optimize";

const BRAND_DIR = path.join(process.cwd(), "public", "brand");

type ConversionReport = {
  file: string;
  webp: string;
  originalBytes: number;
  webpBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
};

async function main(): Promise<void> {
  const entries = await readdir(BRAND_DIR);
  const pngs = entries.filter((f) => f.toLowerCase().endsWith(".png"));

  if (pngs.length === 0) {
    console.error("No PNG files found in public/brand");
    process.exit(1);
  }

  const reports: ConversionReport[] = [];

  for (const file of pngs) {
    const inputPath = path.join(BRAND_DIR, file);
    const webpName = file.replace(/\.png$/i, ".webp");
    const outputPath = path.join(BRAND_DIR, webpName);
    const buffer = await readFile(inputPath);
    const fileStat = await stat(inputPath);

    const result = await optimizeToWebP(buffer, outputPath, {
      quality: 85,
    });

    reports.push({
      file,
      webp: webpName,
      originalBytes: fileStat.size,
      webpBytes: result.webpSize,
      savingsPercent: result.savingsPercent,
      width: result.width,
      height: result.height,
    });

    console.log(
      `✓ ${file} → ${webpName} (${result.savingsPercent}% smaller, ${result.width}×${result.height})`,
    );
  }

  const totalOriginal = reports.reduce((s, r) => s + r.originalBytes, 0);
  const totalWebp = reports.reduce((s, r) => s + r.webpBytes, 0);
  const totalSavings =
    totalOriginal > 0
      ? Math.round(((totalOriginal - totalWebp) / totalOriginal) * 1000) / 10
      : 0;

  console.log("\n--- WebP Conversion Summary ---");
  console.log(`Files converted: ${reports.length}`);
  console.log(`Original total: ${(totalOriginal / 1024).toFixed(1)} KB`);
  console.log(`WebP total:     ${(totalWebp / 1024).toFixed(1)} KB`);
  console.log(`Savings:        ${totalSavings}%`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
