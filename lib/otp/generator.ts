import { randomInt, createHash, timingSafeEqual } from "crypto";

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtpCode(digits: number = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randomInt(min, max + 1).toString();
}

/**
 * Hash OTP code for secure database storage.
 */
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Verify plaintext OTP code against stored hash.
 */
export function verifyOtpCode(inputCode: string, storedHash: string): boolean {
  const normalized = String(inputCode ?? "").replace(/\D/g, "");
  const inputHash = hashOtpCode(normalized);
  const input = Buffer.from(inputHash, "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (input.length === 0 || input.length !== stored.length) {
    return false;
  }
  return timingSafeEqual(input, stored);
}
