import { describe, expect, it } from "vitest";
import {
  canSwitchToOrganization,
  resolveFallbackOrganizationId,
} from "@/features/organizations/services/org-switching";
import {
  personalOrganizationName,
  slugifyHandle,
} from "@/lib/auth/identity-helpers";
import { signUpSchema } from "@/features/authentication/validators/auth";
import {
  isPublicMarketingPath,
  resolveRouteAccess,
  shouldRefreshAuthSession,
} from "@/lib/auth/route-policy";

describe("organization switching", () => {
  it("allows switch only for active memberships", () => {
    expect(
      canSwitchToOrganization({
        memberships: [
          { organizationId: "a", status: "active" },
          { organizationId: "b", status: "removed" },
        ],
        targetOrganizationId: "a",
      }),
    ).toBe(true);

    expect(
      canSwitchToOrganization({
        memberships: [{ organizationId: "b", status: "removed" }],
        targetOrganizationId: "b",
      }),
    ).toBe(false);
  });

  it("falls back to personal organization", () => {
    expect(
      resolveFallbackOrganizationId({
        memberships: [
          { organizationId: "biz", status: "active", kind: "business" },
          { organizationId: "pers", status: "active", kind: "personal" },
        ],
        preferredId: "missing",
      }),
    ).toBe("pers");
  });
});

describe("profile / auth helpers", () => {
  it("slugifies handles", () => {
    expect(slugifyHandle("Alex Work!")).toBe("alex-work");
  });

  it("names personal organizations", () => {
    expect(personalOrganizationName("Alex")).toBe("Alex's Workspace");
    expect(personalOrganizationName("James")).toBe("James' Workspace");
  });

  it("validates signup payloads", () => {
    const parsed = signUpSchema.safeParse({
      email: "a@b.com",
      password: "short",
      displayName: "Alex",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("route policy", () => {
  it("protects app and admin routes", () => {
    expect(resolveRouteAccess("/app/profile")).toBe("authenticated");
    expect(resolveRouteAccess("/admin")).toBe("admin");
    expect(resolveRouteAccess("/auth/sign-in")).toBe("public");
  });

  it("skips session refresh only on public marketing pages", () => {
    expect(isPublicMarketingPath("/")).toBe(true);
    expect(isPublicMarketingPath("/careers")).toBe(true);
    expect(isPublicMarketingPath("/login")).toBe(false);
    expect(shouldRefreshAuthSession("/")).toBe(false);
    expect(shouldRefreshAuthSession("/login")).toBe(true);
    expect(shouldRefreshAuthSession("/earner/dashboard")).toBe(true);
    expect(shouldRefreshAuthSession("/auth/callback")).toBe(true);
  });
});
