import { describe, expect, it } from "vitest";
import {
  buildOnboardingAddressJson,
  isOnboardingComplete,
  jwtAppMetadataRoles,
  mergeWorkerClientRoleKeys,
  productRoleFromRbac,
  signupRoleToParticipation,
  signupRoleToRoleKeys,
} from "@/lib/auth/product-identity";

describe("product identity", () => {
  it("maps signup roles onto Prisma participation and role keys", () => {
    expect(signupRoleToParticipation("worker")).toBe("worker");
    expect(signupRoleToParticipation("employer")).toBe("client");
    expect(signupRoleToRoleKeys("worker")).toEqual(["worker"]);
    expect(signupRoleToRoleKeys("employer")).toEqual(["client"]);
  });

  it("builds JWT app_metadata.roles from product roles and preserves platform keys", () => {
    expect(jwtAppMetadataRoles("worker")).toEqual(["worker"]);
    expect(jwtAppMetadataRoles("employer")).toEqual(["employer"]);
    expect(jwtAppMetadataRoles("super_admin")).toEqual(["super_admin"]);
    expect(mergeWorkerClientRoleKeys(["worker"], "employer")).toEqual(["client"]);
    expect(mergeWorkerClientRoleKeys(["client", "admin"], "worker")).toEqual([
      "worker",
      "admin",
    ]);
  });

  it("resolves product roles from user_roles and participation", () => {
    expect(
      productRoleFromRbac({
        participation: "worker",
        roleKeys: ["worker"],
      }),
    ).toBe("worker");
    expect(
      productRoleFromRbac({
        participation: "client",
        roleKeys: ["client"],
      }),
    ).toBe("employer");
    expect(
      productRoleFromRbac({
        participation: "worker",
        roleKeys: ["admin"],
      }),
    ).toBe("admin");
    expect(
      productRoleFromRbac({
        participation: "client",
        roleKeys: ["super_admin"],
      }),
    ).toBe("super_admin");
    expect(
      productRoleFromRbac({
        participation: "worker",
        roleKeys: ["operations", "moderator"],
      }),
    ).toBe("staff");
  });

  it("treats country_code plus city in address_json as onboarding completion", () => {
    expect(
      isOnboardingComplete({ countryCode: null, addressJson: null }),
    ).toBe(false);
    expect(
      isOnboardingComplete({
        countryCode: "Nigeria",
        addressJson: buildOnboardingAddressJson({ city: "" }),
      }),
    ).toBe(false);
    expect(
      isOnboardingComplete({
        countryCode: "Nigeria",
        addressJson: buildOnboardingAddressJson({
          city: "Lagos",
          state: "Lagos",
        }),
      }),
    ).toBe(true);
  });
});
