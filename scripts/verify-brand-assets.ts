/**
 * Validates that required brand assets exist.
 * Usage: npx tsx scripts/verify-brand-assets.ts
 */

import { access } from "node:fs/promises";
import path from "node:path";

const REQUIRED = ["light-theme-logo.webp", "icon.webp"] as const;

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
    const assetPath = path.join(brandDir, name);
    const hasAsset = await exists(assetPath);

    if (!hasAsset) {
      console.error(`✗ Missing asset: ${name}`);
      ok = false;
    } else {
      console.log(`✓ Verified asset: ${name}`);
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
