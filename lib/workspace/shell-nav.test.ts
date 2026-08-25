import { describe, expect, it } from "vitest";
import {
  chromeRoleFromPlatformRoles,
  headerWalletHref,
  isAdminWorkspacePath,
  isHirerWorkspacePath,
  resolveShellChrome,
} from "@/lib/workspace/shell-nav";

describe("headerWalletHref", () => {
  it("hides Wallet on Admin and lex chrome only", () => {
    expect(headerWalletHref("/admin")).toBeNull();
    expect(headerWalletHref("/admin/queues")).toBeNull();
    expect(headerWalletHref("/lex/auth")).toBeNull();
    expect(headerWalletHref("/lex/staff")).toBeNull();
  });

  it("hides Wallet on shared /settings when the session is Admin", () => {
    expect(headerWalletHref("/settings", "admin")).toBeNull();
    expect(headerWalletHref("/settings", "super_admin")).toBeNull();
    expect(headerWalletHref("/support", "admin")).toBeNull();
  });

  it("keeps Wallet for Earner and Hirer on their existing routes", () => {
    expect(headerWalletHref("/earner/dashboard")).toBe("/wallet");
    expect(headerWalletHref("/wallet")).toBe("/wallet");
    expect(headerWalletHref("/tasks")).toBe("/wallet");
    expect(headerWalletHref("/settings", "worker")).toBe("/wallet");
    expect(headerWalletHref("/hirer/dashboard")).toBe("/hirer/wallet");
    expect(headerWalletHref("/hirer/wallet")).toBe("/hirer/wallet");
    expect(headerWalletHref("/settings", "employer")).toBe("/hirer/wallet");
  });
});

describe("workspace path helpers", () => {
  it("classifies admin and hirer prefixes without overlapping", () => {
    expect(isAdminWorkspacePath("/admin")).toBe(true);
    expect(isAdminWorkspacePath("/lex/staff")).toBe(true);
    expect(isAdminWorkspacePath("/earner/dashboard")).toBe(false);
    expect(isHirerWorkspacePath("/hirer/opportunities")).toBe(true);
    expect(isHirerWorkspacePath("/wallet")).toBe(false);
  });
});

describe("resolveShellChrome", () => {
  it("uses the authenticated role on shared routes instead of pathname", () => {
    expect(resolveShellChrome("/settings", "admin")).toBe("super_admin");
    expect(resolveShellChrome("/settings", "worker")).toBe("earner");
    expect(resolveShellChrome("/settings", "employer")).toBe("hirer");
    expect(resolveShellChrome("/support", "admin")).toBe("super_admin");
  });

  it("keeps existing Admin path split for Operations versus Super admin", () => {
    expect(resolveShellChrome("/admin", "admin")).toBe("staff");
    expect(resolveShellChrome("/lex/staff", "admin")).toBe("staff");
    expect(resolveShellChrome("/lex/auth", "admin")).toBe("super_admin");
    expect(resolveShellChrome("/lex/staff", "staff")).toBe("staff");
  });

  it("falls back to pathname when no session role is available", () => {
    expect(resolveShellChrome("/settings")).toBe("earner");
    expect(resolveShellChrome("/admin")).toBe("staff");
    expect(resolveShellChrome("/lex/auth")).toBe("super_admin");
    expect(resolveShellChrome("/hirer/settings")).toBe("hirer");
  });
});

describe("chromeRoleFromPlatformRoles", () => {
  it("maps RBAC keys to the proxy role names", () => {
    expect(chromeRoleFromPlatformRoles(["super_admin"])).toBe("admin");
    expect(chromeRoleFromPlatformRoles(["admin"])).toBe("admin");
    expect(chromeRoleFromPlatformRoles(["staff"])).toBe("staff");
    expect(chromeRoleFromPlatformRoles(["client"])).toBe("employer");
    expect(chromeRoleFromPlatformRoles(["worker"])).toBe("worker");
    expect(chromeRoleFromPlatformRoles([])).toBe("");
  });
});
