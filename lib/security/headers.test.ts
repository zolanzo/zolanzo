import { describe, expect, it } from "vitest";
import {
  NONCE_HEADER,
  applyCspToRequest,
  applySecurityHeaders,
  buildContentSecurityPolicy,
} from "@/lib/security/headers";
import { NextResponse } from "next/server";

describe("CSP nonce contract", () => {
  it("keeps a strict script policy with nonce and strict-dynamic", () => {
    const policy = buildContentSecurityPolicy("abc123");
    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toMatch(/script-src [^;]*'unsafe-inline'/);
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("puts the nonce on the request so Next.js can stamp scripts", () => {
    const requestHeaders = new Headers();
    applyCspToRequest(requestHeaders, "abc123");
    expect(requestHeaders.get(NONCE_HEADER)).toBe("abc123");
    expect(requestHeaders.get("Content-Security-Policy")).toContain(
      "'nonce-abc123'",
    );
    expect(requestHeaders.get("Content-Security-Policy")).toContain(
      "'strict-dynamic'",
    );
  });

  it("mirrors the nonce CSP onto the outgoing response", () => {
    const response = applySecurityHeaders(NextResponse.next(), "abc123");
    expect(response.headers.get(NONCE_HEADER)).toBe("abc123");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "'nonce-abc123'",
    );
  });
});
