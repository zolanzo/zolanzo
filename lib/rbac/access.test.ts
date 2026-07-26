import { describe, expect, it } from "vitest";
import {
  can,
  canInOrg,
  hasPlatformRole,
  resolveRoles,
} from "@/lib/rbac/access";
import type { ActorContext } from "@/types/domain";

const baseActor: ActorContext = {
  userId: "user_1" as ActorContext["userId"],
  accountType: "individual",
  userTypes: [],
  participation: "both",
  tenant: {
    organizationId: "org_1" as ActorContext["tenant"]["organizationId"],
    workspaceId: null,
    teamIds: [],
  },
  orgRoles: ["owner"],
  isAuthenticated: true,
};

describe("RBAC", () => {
  it("grants worker marketplace claim via participation", () => {
    const decision = can(baseActor, "marketplace.claim", {
      platformRoles: ["worker"],
    });
    expect(decision.allowed).toBe(true);
  });

  it("denies admin access without admin role", () => {
    const decision = can(baseActor, "admin.access", {
      platformRoles: ["worker"],
    });
    expect(decision.allowed).toBe(false);
  });

  it("checks org permissions for owner", () => {
    const decision = canInOrg(baseActor, "org.members.invite", "owner");
    expect(decision.allowed).toBe(true);
  });

  it("resolves roles from platform + participation", () => {
    const roles = resolveRoles(baseActor, { platformRoles: ["developer"] });
    expect(roles).toContain("developer");
    expect(roles).toContain("worker");
    expect(roles).toContain("client");
  });

  it("detects platform roles", () => {
    expect(hasPlatformRole(["admin", "worker"], "admin")).toBe(true);
    expect(hasPlatformRole(["worker"], "admin")).toBe(false);
  });
});
