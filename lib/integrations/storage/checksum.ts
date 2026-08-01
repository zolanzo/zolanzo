/**
 * Content checksum helpers — SHA-256 for deduplication.
 */

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256HexOfText(text: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(text));
}

/** Object key fragment from checksum (stable dedup path component). */
export function checksumObjectFragment(checksumSha256: string): string {
  return checksumSha256.slice(0, 32);
}
