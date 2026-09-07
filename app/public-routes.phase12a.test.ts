import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("Phase 12A public route remediations", () => {
  it("resolves /terms without invented contractual language", () => {
    const page = read("app/terms/page.tsx");
    const legal = read("components/legal/legal-support-page.tsx");
    expect(page).toContain('path: "/terms"');
    expect(page).toContain("Terms & Conditions");
    expect(legal).toContain("LEGAL_DOCUMENT_UNAVAILABLE_NOTICE");
    expect(legal).not.toContain("governing law");
    expect(legal).not.toContain("limitation of liability");
  });

  it("resolves /privacy without invented contractual language", () => {
    const page = read("app/privacy/page.tsx");
    expect(page).toContain('path: "/privacy"');
    expect(page).toContain("Privacy Policy");
  });

  it("keeps signup linked to /terms and /privacy", () => {
    const signup = read("app/signup/page.tsx");
    expect(signup).toContain('href="/terms"');
    expect(signup).toContain('href="/privacy"');
  });

  it("blocks design-system and /dev demo surfaces unless development", () => {
    const designLayout = read("app/design-system/layout.tsx");
    const devLayout = read("app/dev/layout.tsx");
    expect(designLayout).toContain("isDevOnlyRoutePublic");
    expect(designLayout).toContain("notFound()");
    expect(devLayout).toContain("isDevOnlyRoutePublic");
    expect(devLayout).toContain("notFound()");
  });

  it("redirects /how-it-works to the homepage section", () => {
    const page = read("app/how-it-works/page.tsx");
    expect(page).toContain('redirect("/#how-it-works")');
  });

  it("does not show a verify-email resend countdown without email context", () => {
    const page = read("app/verify-email/page.tsx");
    expect(page).toContain("hasEmailVerificationContext");
    expect(page).toContain("enableResend={hasEmail}");
    expect(read("components/auth/otp-input.tsx")).toContain("enableResend && timeLeft > 0");
  });

  it("does not use demo-shell copy on the global 404 page", () => {
    const notFound = read("app/not-found.tsx");
    expect(notFound).not.toContain("demo shell");
    expect(notFound).not.toContain("browse templates");
    expect(notFound).toContain("does not exist or has been moved");
  });
});
