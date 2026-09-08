import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  decideProxyAccess,
  getRoleHomePath,
  jwtRolesFromAuthUser,
} from "@/lib/auth/proxy-access";

describe("decideProxyAccess", () => {
  it("redirects unauthenticated users to login in production", () => {
    const decision = decideProxyAccess({
      pathname: "/earner/dashboard",
      authenticated: false,
      roles: [],
      userRole: "",
      nodeEnv: "production",
    });
    expect(decision).toEqual({
      action: "redirect",
      pathname: "/login",
      next: "/earner/dashboard",
    });
  });

  it("allows unauthenticated empty-layout viewing only in development", () => {
    const decision = decideProxyAccess({
      pathname: "/wallet",
      authenticated: false,
      roles: [],
      userRole: "",
      nodeEnv: "development",
    });
    expect(decision).toEqual({ action: "next" });
  });

  it("still isolates authenticated roles in development", () => {
    const decision = decideProxyAccess({
      pathname: "/hirer/dashboard",
      authenticated: true,
      roles: ["worker"],
      userRole: "worker",
      nodeEnv: "development",
    });
    expect(decision).toEqual({
      action: "redirect",
      pathname: "/earner/dashboard",
    });
  });

  it("keeps staff and admin routes protected in production", () => {
    expect(
      decideProxyAccess({
        pathname: "/lex/auth",
        authenticated: false,
        roles: [],
        userRole: "",
        nodeEnv: "production",
      }),
    ).toMatchObject({ action: "redirect", pathname: "/login" });

    expect(
      decideProxyAccess({
        pathname: "/admin",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/earner/dashboard" });
  });

  it("routes the three test roles to their homes and keeps cross-role isolation", () => {
    expect(
      decideProxyAccess({
        pathname: "/login",
        authenticated: true,
        roles: ["admin"],
        userRole: "admin",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/lex/auth" });

    expect(
      decideProxyAccess({
        pathname: "/login",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/earner/dashboard" });

    expect(
      decideProxyAccess({
        pathname: "/login",
        authenticated: true,
        roles: ["employer"],
        userRole: "employer",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/hirer/dashboard" });

    expect(
      decideProxyAccess({
        pathname: "/admin",
        authenticated: true,
        roles: ["employer"],
        userRole: "employer",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/hirer/dashboard" });

    expect(
      decideProxyAccess({
        pathname: "/lex/auth",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "development",
      }),
    ).toEqual({
      action: "redirect",
      pathname: "/earner/dashboard",
    });
  });

  it("sends authenticated unauthorized users to their role home, not login", () => {
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
        pathname: "/lex/staff",
        authenticated: true,
        roles: ["employer"],
        userRole: "employer",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/hirer/dashboard" });

    expect(
      decideProxyAccess({
        pathname: "/admin",
        authenticated: true,
        roles: ["admin"],
        userRole: "admin",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "next" });

    expect(
      decideProxyAccess({
        pathname: "/hirer/dashboard",
        authenticated: true,
        roles: ["client"],
        userRole: "client",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "next" });
  });
});

describe("jwtRolesFromAuthUser", () => {
  it("uses app_metadata.roles and ignores user_metadata.role", () => {
    expect(
      jwtRolesFromAuthUser({
        app_metadata: { roles: ["worker"] },
        user_metadata: { role: "admin" },
      }),
    ).toEqual({ roles: ["worker"], userRole: "worker" });
  });

  it("ignores a non-array app_metadata.roles value", () => {
    expect(
      jwtRolesFromAuthUser({
        app_metadata: { roles: "admin" },
        user_metadata: { role: "admin" },
      }),
    ).toEqual({ roles: [], userRole: "" });
  });
});

describe("role home paths and remaining isolation", () => {
  it("maps established homes", () => {
    expect(getRoleHomePath("worker")).toBe("/earner/dashboard");
    expect(getRoleHomePath("employer")).toBe("/hirer/dashboard");
    expect(getRoleHomePath("client")).toBe("/hirer/dashboard");
    expect(getRoleHomePath("admin")).toBe("/lex/auth");
    expect(getRoleHomePath("super_admin")).toBe("/lex/auth");
    expect(getRoleHomePath("staff")).toBe("/lex/staff");
    expect(getRoleHomePath("")).toBe("/login");
  });

  it("blocks anonymous access to /tasks with a next param", () => {
    expect(
      decideProxyAccess({
        pathname: "/tasks",
        authenticated: false,
        roles: [],
        userRole: "",
        nodeEnv: "production",
      }),
    ).toEqual({
      action: "redirect",
      pathname: "/login",
      next: "/tasks",
    });
  });

  it("allows worker earner routes and blocks hirer and lex", () => {
    expect(
      decideProxyAccess({
        pathname: "/earner/dashboard",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "next" });

    expect(
      decideProxyAccess({
        pathname: "/hirer/dashboard",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "production",
      }),
    ).toEqual({
      action: "redirect",
      pathname: "/earner/dashboard",
    });

    expect(
      decideProxyAccess({
        pathname: "/lex/staff",
        authenticated: true,
        roles: ["worker"],
        userRole: "worker",
        nodeEnv: "production",
      }),
    ).toEqual({
      action: "redirect",
      pathname: "/earner/dashboard",
    });
  });

  it("allows hirer routes and blocks earner surfaces", () => {
    expect(
      decideProxyAccess({
        pathname: "/hirer/opportunities",
        authenticated: true,
        roles: ["employer"],
        userRole: "employer",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "next" });

    expect(
      decideProxyAccess({
        pathname: "/earner/dashboard",
        authenticated: true,
        roles: ["employer"],
        userRole: "employer",
        nodeEnv: "production",
      }),
    ).toEqual({
      action: "redirect",
      pathname: "/hirer/dashboard",
    });
  });

  it("allows staff the staff lex surface and admin the admin surfaces", () => {
    expect(
      decideProxyAccess({
        pathname: "/lex/staff",
        authenticated: true,
        roles: ["staff"],
        userRole: "staff",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "next" });

    expect(
      decideProxyAccess({
        pathname: "/lex/auth",
        authenticated: true,
        roles: ["super_admin"],
        userRole: "super_admin",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "next" });
  });

  it("sends authenticated users with missing JWT roles to login, not a query-in-pathname", () => {
    expect(
      decideProxyAccess({
        pathname: "/earner/dashboard",
        authenticated: true,
        roles: [],
        userRole: "",
        nodeEnv: "production",
      }),
    ).toEqual({ action: "redirect", pathname: "/login" });
  });

  it("keeps proxy.ts on JWT app_metadata.roles only", () => {
    const proxy = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
    expect(proxy).toContain("jwtRolesFromAuthUser");
    expect(proxy).not.toContain("user_metadata");
    expect(proxy).not.toContain("profiles");
  });
});
