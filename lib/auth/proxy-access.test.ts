import { describe, expect, it } from "vitest";
import { decideProxyAccess } from "@/lib/auth/proxy-access";

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
  });
});
