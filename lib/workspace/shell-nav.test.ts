import { describe, expect, it } from "vitest";
import {
  headerWalletHref,
  isAdminWorkspacePath,
  isHirerWorkspacePath,
} from "@/lib/workspace/shell-nav";

describe("headerWalletHref", () => {
  it("hides Wallet on Admin and lex chrome only", () => {
    expect(headerWalletHref("/admin")).toBeNull();
    expect(headerWalletHref("/admin/queues")).toBeNull();
    expect(headerWalletHref("/lex/auth")).toBeNull();
    expect(headerWalletHref("/lex/staff")).toBeNull();
  });

  it("keeps Wallet for Earner and Hirer on their existing routes", () => {
    expect(headerWalletHref("/earner/dashboard")).toBe("/wallet");
    expect(headerWalletHref("/wallet")).toBe("/wallet");
    expect(headerWalletHref("/tasks")).toBe("/wallet");
    expect(headerWalletHref("/hirer/dashboard")).toBe("/hirer/wallet");
    expect(headerWalletHref("/hirer/wallet")).toBe("/hirer/wallet");
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
