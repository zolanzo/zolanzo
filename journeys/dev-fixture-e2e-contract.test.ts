import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { decideProxyAccess, getRoleHomePath } from "@/lib/auth/proxy-access";
import { productRoleFromRbac } from "@/lib/auth/product-identity";
import {
  canModerateMarketplaceCampaign,
  resolveCampaignClientUserId,
} from "@/features/campaigns/services/moderation";
import { assertHirerReviewAccess, assertSameUser } from "@/lib/auth/resource-guards";
import { AppError } from "@/lib/api/response";
import { DEV_MARKETPLACE_USERS } from "../prisma/seed/dev-marketplace-constants";
import {
  ZOLANZO_PRODUCTION_PROJECT_REF,
} from "@/lib/dev/assert-dev-seed-target";
import type { SessionUser } from "@/lib/auth/session";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function session(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user_a",
    authSubject: "sub",
    email: "a@zolanzo.local",
    accountType: "individual",
    participation: "client",
    platformRoles: ["client"],
    activeOrganizationId: "org_a",
    profile: { displayName: "A", handle: "a", avatarUrl: null },
    memberships: [
      {
        organizationId: "org_a",
        orgRole: "owner",
        status: "active",
        organization: {
          id: "org_a",
          name: "A",
          slug: "a",
          kind: "business",
          publicId: "ORG-A",
        },
      },
    ],
    ...overrides,
  };
}

describe("dev fixture + journey contracts", () => {
  it("guards every development fixture entry point", () => {
    for (const file of [
      "prisma/seed/index.ts",
      "scripts/seed-test-users.ts",
      "scripts/run-dev-marketplace-flow.ts",
      "scripts/run-e2e-auth-verification.ts",
      "scripts/trace-browser-auth.ts",
    ]) {
      expect(read(file)).toContain("assertDevelopmentSeedTarget");
    }
    expect(read("package.json")).toContain(
      "scripts/shims/dev-cli.cjs",
    );
  });

  it("does not fall back to the production Supabase URL", () => {
    const productionFallback = `|| "https://${ZOLANZO_PRODUCTION_PROJECT_REF}.supabase.co"`;
    expect(read("scripts/run-e2e-auth-verification.ts")).not.toContain(
      productionFallback,
    );
    expect(read("scripts/trace-browser-auth.ts")).not.toContain(
      productionFallback,
    );
  });

  it("maps fixture identities onto JWT homes without hirer self-approval", () => {
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.admin.jwtRoles[0])).toBe(
      "/lex/auth",
    );
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.staff.jwtRoles[0])).toBe(
      "/lex/staff",
    );
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.worker.jwtRoles[0])).toBe(
      "/earner/dashboard",
    );
    expect(getRoleHomePath(DEV_MARKETPLACE_USERS.hirer.jwtRoles[0])).toBe(
      "/hirer/dashboard",
    );
    expect(
      productRoleFromRbac({
        participation: DEV_MARKETPLACE_USERS.staff.participation,
        roleKeys: DEV_MARKETPLACE_USERS.staff.roleKeys,
      }),
    ).toBe("staff");
    expect(canModerateMarketplaceCampaign(["client"])).toBe(false);
    expect(
      canModerateMarketplaceCampaign([
        ...DEV_MARKETPLACE_USERS.staff.roleKeys,
      ]),
    ).toBe(true);
  });

  it("blocks unauthorized workspace navigation at the proxy", () => {
    expect(
      decideProxyAccess({
        pathname: "/lex/auth",
        authenticated: true,
        roles: ["staff"],
        userRole: "staff",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/lex/staff" });
    expect(
      decideProxyAccess({
        pathname: "/admin",
        authenticated: true,
        roles: ["staff"],
        userRole: "staff",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/lex/staff" });
    expect(
      decideProxyAccess({
        pathname: "/lex/staff",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/earner/dashboard" });
    expect(
      decideProxyAccess({
        pathname: "/hirer/dashboard",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/earner/dashboard" });
  });

  it("enforces IDOR contracts A–G at the guard/service layer", () => {
    expect(() => assertSameUser("earner_a", "earner_b")).toThrow(AppError);
    expect(() =>
      assertHirerReviewAccess({
        user: session({
          id: "hirer_b",
          memberships: [
            {
              organizationId: "org_b",
              orgRole: "owner",
              status: "active",
              organization: {
                id: "org_b",
                name: "B",
                slug: "b",
                kind: "business",
                publicId: "ORG-B",
              },
            },
          ],
        }),
        organizationId: "org_a",
        clientUserId: "hirer_a",
      }),
    ).toThrow(AppError);
    expect(
      resolveCampaignClientUserId({
        actorUserId: "hirer_a",
        platformRoles: ["client"],
        requestedClientUserId: "victim_b",
      }),
    ).toBe("hirer_a");
    expect(read("features/task-marketplace/actions/marketplace-actions.ts")).toContain(
      "workerUserId: ctx.user.id",
    );
    expect(read("features/task-marketplace/actions/work-session-action.ts")).toContain(
      "ctx.user.id",
    );
    expect(read("features/campaigns/actions/campaign-actions.ts")).toContain(
      "requirePlatformRoles",
    );
  });
});
