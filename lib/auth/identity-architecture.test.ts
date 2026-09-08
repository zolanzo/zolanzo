import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getRoleHomePath } from "@/lib/auth/proxy-access";
import {
  jwtAppMetadataRoles,
  productRoleFromRbac,
  signupRoleToParticipation,
  signupRoleToRoleKeys,
} from "@/lib/auth/product-identity";
import { EMAIL_OTP_MAX_ATTEMPTS, EMAIL_OTP_PURPOSE, EMAIL_OTP_TTL_MS } from "@/lib/auth/email-otp-constants";
import { authPasswordFromPin } from "@/lib/auth/pin-credentials";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("identity architecture", () => {
  it("maps worker and employer signup onto participation, user_roles, JWT, and home paths", () => {
    expect(signupRoleToParticipation("worker")).toBe("worker");
    expect(signupRoleToRoleKeys("worker")).toEqual(["worker"]);
    expect(jwtAppMetadataRoles("worker")).toEqual(["worker"]);
    expect(getRoleHomePath("worker")).toBe("/earner/dashboard");

    expect(signupRoleToParticipation("employer")).toBe("client");
    expect(signupRoleToRoleKeys("employer")).toEqual(["client"]);
    expect(
      productRoleFromRbac({
        participation: "client",
        roleKeys: ["client"],
      }),
    ).toBe("employer");
    expect(jwtAppMetadataRoles("employer")).toEqual(["employer"]);
    expect(getRoleHomePath("employer")).toBe("/hirer/dashboard");
    expect(getRoleHomePath("client")).toBe("/hirer/dashboard");
  });

  it("does not require profiles.role in the live identity path", () => {
    const files = [
      "lib/auth/service.ts",
      "lib/auth/onboarding.ts",
      "lib/auth/settings.ts",
      "lib/auth/email-otp.ts",
      "lib/auth/apply-product-role.ts",
      "features/authentication/services/phone-verification.ts",
      "scripts/seed-test-users.ts",
    ];
    for (const file of files) {
      const source = read(file);
      expect(source).not.toMatch(/from\("profiles"\)[\s\S]{0,80}\.role/);
      expect(source).not.toContain("profiles.role");
      expect(source).not.toMatch(/\bpin_hash\b/);
    }
    expect(read("lib/auth/settings.ts")).not.toContain('.from("profiles")');
    expect(read("lib/auth/service.ts")).not.toContain("user_metadata: { role");
    expect(read("scripts/seed-test-users.ts")).not.toContain("role: account.role");
  });

  it("keeps email OTP purpose isolation, hashed codes, TTL, and attempt limits", () => {
    expect(EMAIL_OTP_PURPOSE.emailVerification).toBe("email_verification");
    expect(EMAIL_OTP_PURPOSE.pinReset).toBe("pin_reset");
    expect(EMAIL_OTP_TTL_MS).toBe(10 * 60 * 1000);
    expect(EMAIL_OTP_MAX_ATTEMPTS).toBe(5);
    expect(read("lib/auth/email-otp.ts")).toContain("codeHash");
    expect(read("lib/auth/service.ts")).toContain("emailVerifiedAt");
    expect(read("lib/auth/service.ts")).toContain("authPasswordFromPin(newPin)");
    expect(authPasswordFromPin("246810")).toContain("246810");
    expect(authPasswordFromPin("246810")).not.toBe("246810");
  });

  it("persists phone verification on users.phoneVerifiedAt, not overlay profile flags", () => {
    const phone = read("features/authentication/services/phone-verification.ts");
    expect(phone).toContain("phoneVerifiedAt");
    expect(phone).not.toContain("phone_verified");
    expect(phone).not.toContain('.from("profiles")');
  });
});
