/**
 * Validates that all brand WebP assets exist alongside PNG originals.
 * Usage: npx tsx scripts/verify-brand-assets.ts
 */

import { access } from "node:fs/promises";
import path from "node:path";

const REQUIRED = [
  "logo",
  "icon",
  "app-icon",
  "favicon",
  "monochrome",
] as const;

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const brandDir = path.join(process.cwd(), "public", "brand");
  let ok = true;

  for (const name of REQUIRED) {
    const png = path.join(brandDir, `${name}.png`);
    const webp = path.join(brandDir, `${name}.webp`);
    const hasPng = await exists(png);
    const hasWebp = await exists(webp);

    if (!hasPng) {
      console.error(`✗ Missing PNG: ${name}.png`);
      ok = false;
    }
    if (!hasWebp) {
      console.error(`✗ Missing WebP: ${name}.webp`);
      ok = false;
    }
    if (hasPng && hasWebp) {
      console.log(`✓ ${name}.png + ${name}.webp`);
    }
  }

  if (!ok) {
    process.exit(1);
  }

  console.log("\nAll brand assets verified.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
