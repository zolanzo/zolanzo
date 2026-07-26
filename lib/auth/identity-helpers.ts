/**
 * Pure helpers for handles, personal org naming, tokens.
 */

export function slugifyHandle(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return base.length >= 3 ? base : `user-${base || "z"}`;
}

export function personalOrganizationName(displayName: string): string {
  const name = displayName.trim() || "My";
  const possessive = name.endsWith("s") ? `${name}'` : `${name}'s`;
  return `${possessive} Workspace`;
}

export function personalOrganizationSlug(userId: string): string {
  return `personal-${userId.toLowerCase()}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function generateOpaqueToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function deviceFingerprint(input: {
  userAgent?: string | null;
  ip?: string | null;
}): string {
  const raw = `${input.userAgent ?? "unknown"}|${input.ip ?? "unknown"}`;
  // Sync fingerprint for edge — simple non-crypto hash for device grouping
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash)}`;
}
