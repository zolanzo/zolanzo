import type { NextResponse } from "next/server";

/**
 * Request header Next.js reads so it can stamp runtime and Flight
 * scripts with the matching CSP nonce.
 */
export const NONCE_HEADER = "x-nonce";

/**
 * Enterprise security headers for ZOLANZO.
 * Applied via proxy and next.config headers().
 */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/**
 * Content Security Policy.
 * Tuned for Next.js App Router + Supabase + Google Fonts.
 * Tighten further when third-party scripts are introduced.
 */
export function buildContentSecurityPolicy(nonce?: string): string {
  const isDev = process.env.NODE_ENV === "development";

  const scriptSrc = [
    "'self'",
    nonce ? `'nonce-${nonce}'` : null,
    isDev ? "'unsafe-eval'" : null,
    "'strict-dynamic'",
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

/**
 * Next.js extracts the nonce from the incoming request CSP header
 * (`'nonce-{value}'`) and from `x-nonce`. Both must be set on the
 * request that reaches the renderer, not only on the outgoing response.
 */
export function applyCspToRequest(requestHeaders: Headers, nonce: string): void {
  const policy = buildContentSecurityPolicy(nonce);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set("Content-Security-Policy", policy);
}

export function applySecurityHeaders(
  response: NextResponse,
  nonce?: string,
): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce),
  );

  if (nonce) {
    response.headers.set(NONCE_HEADER, nonce);
  }

  return response;
}
