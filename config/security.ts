/**
 * Security configuration (non-secret policy).
 */

export const SECURITY_CONFIG = {
  csrf: {
    cookieName: "zolanzo_csrf",
    headerName: "x-csrf-token",
    minSecretLength: 32,
  },
  sessions: {
    absoluteTtlHours: 24 * 14,
    idleTtlHours: 24 * 7,
  },
  cookies: {
    httpOnly: true,
    sameSite: "lax" as const,
    secureInProduction: true,
    path: "/",
  },
  rateLimit: {
    defaultWindowMs: 60_000,
    defaultMax: 60,
  },
  serviceRole: {
    /** Service role client must never be imported from Client Components */
    serverOnly: true,
  },
} as const;

export type SecurityConfig = typeof SECURITY_CONFIG;
