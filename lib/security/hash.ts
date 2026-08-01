import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Server-Side PIN Hashing & Validation Service
 * Uses SHA-256 with a 16-byte random salt and timing-safe comparison.
 */

export function hashPin(pin: string, saltHex?: string): { hash: string; salt: string } {
  if (!/^\d{6}$/.test(pin)) {
    throw new Error("PIN must consist of exactly 6 numeric digits.");
  }

  const salt = saltHex || randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(`${salt}:${pin}`)
    .digest("hex");

  return { hash, salt };
}

export function verifyPin(pin: string, storedHash: string, storedSalt: string): boolean {
  if (!/^\d{6}$/.test(pin) || !storedHash || !storedSalt) {
    return false;
  }

  const computedHash = createHash("sha256")
    .update(`${storedSalt}:${pin}`)
    .digest("hex");

  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(storedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

/**
 * Encodes full hash string format: `salt:hash`
 */
export function formatStoredPin(pin: string): string {
  const { hash, salt } = hashPin(pin);
  return `${salt}:${hash}`;
}

export function verifyStoredPin(pin: string, formattedPinHash: string): boolean {
  if (!formattedPinHash || !formattedPinHash.includes(":")) {
    return false;
  }

  const [salt, hash] = formattedPinHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  return verifyPin(pin, hash, salt);
}
