/**
 * CSRF readiness utilities.
 * Token generation/verification hooks for mutating API routes.
 *
 * Production wiring: set CSRF_SECRET and store tokens in
 * httpOnly cookies or double-submit headers.
 */

const CSRF_HEADER = "x-csrf-token";
const CSRF_COOKIE = "zolanzo_csrf";

export const CSRF_CONFIG = {
  header: CSRF_HEADER,
  cookie: CSRF_COOKIE,
  tokenBytes: 32,
  cookieOptions: {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  },
} as const;

/**
 * Generates a cryptographically random CSRF token (hex).
 * Ready for cookie + header double-submit pattern.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_CONFIG.tokenBytes);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validates double-submit CSRF: cookie token must match header token.
 */
export function validateCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined,
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  return timingSafeEqual(cookieToken, headerToken);
}
