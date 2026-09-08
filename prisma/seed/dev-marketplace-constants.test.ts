import { describe, expect, it } from "vitest";
import { getRoleHomePath } from "@/lib/auth/proxy-access";
import { productRoleFromRbac } from "@/lib/auth/product-identity";
import {
  DEV_CAMPAIGN_SLUG,
  DEV_HIRER_ORG_SLUG,
  DEV_MARKETPLACE_USERS,
  DEV_TEMPLATE_KEY,
} from "./dev-marketplace-constants";

describe("development marketplace fixture identifiers", () => {
  it("uses local development emails only", () => {
    const emails = Object.values(DEV_MARKETPLACE_USERS).map((user) => user.email);
    expect(emails.every((email) => email.endsWith("@zolanzo.local"))).toBe(true);
    expect(emails.some((email) => email.includes("zolanzo.com"))).toBe(false);
  });

  it("keeps a single org/campaign/template contract", () => {
    expect(DEV_HIRER_ORG_SLUG).toBe("dev-fixture-hirer-workspace");
    expect(DEV_CAMPAIGN_SLUG).toBe("dev-fixture-website-signup");
    expect(DEV_TEMPLATE_KEY).toBe("website_signup");
  });

  it("separates admin, staff, earner, and hirer JWT homes", () => {
    expect(DEV_MARKETPLACE_USERS.admin.jwtRoles[0]).toBe("admin");
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.admin.jwtRoles[0])).toBe(
      "/lex/auth",
    );
    expect(DEV_MARKETPLACE_USERS.staff.jwtRoles[0]).toBe("staff");
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.staff.jwtRoles[0])).toBe(
      "/lex/staff",
    );
    expect(
      productRoleFromRbac({
        participation: DEV_MARKETPLACE_USERS.staff.participation,
        roleKeys: DEV_MARKETPLACE_USERS.staff.roleKeys,
      }),
    ).toBe("staff");
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.worker.jwtRoles[0])).toBe(
      "/earner/dashboard",
    );
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.hirer.jwtRoles[0])).toBe(
      "/hirer/dashboard",
    );
  });
});
