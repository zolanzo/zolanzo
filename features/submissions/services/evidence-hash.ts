/**
 * Evidence hash helper (content addressing for immutability checks).
 */

export async function hashBytes(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", bytes.slice());
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback for environments without subtle crypto
  let h = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    h = (h * 31 + bytes[i]!) >>> 0;
  }
  return `fallback-${h.toString(16)}-${bytes.length}`;
}

export function hashText(text: string): Promise<string> {
  return hashBytes(new TextEncoder().encode(text));
}
