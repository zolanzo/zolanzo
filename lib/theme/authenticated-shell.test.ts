import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("authenticated theme chrome", () => {
  it("keeps the compact theme control on the desktop authenticated header", () => {
    const header = read("components/shell/top-header.tsx");
    expect(header).toContain("ThemeModeControl");
    expect(header).toContain('variant="compact"');
    expect(header).toContain("hidden md:block");
    expect(header).toContain("bg-topbar");
    expect(header).toContain("text-foreground");
  });

  it("uses semantic surfaces in AppShell", () => {
    const shell = read("components/shell/app-shell.tsx");
    expect(shell).toContain("surface-shell");
    expect(shell).toContain("TopHeader");
    expect(shell).toContain("Sidebar");
  });

  it("wraps admin and lex layouts in AdminShell for the same chrome", () => {
    expect(read("app/admin/layout.tsx")).toContain("AdminShell");
    expect(read("app/lex/layout.tsx")).toContain("AdminShell");
    expect(read("components/shell/admin-shell.tsx")).toContain("AppShell");
  });

  it("does not leave light-only white dividers in admin lex tables", () => {
    expect(read("app/lex/auth/page.tsx")).not.toContain("divide-white");
    expect(read("app/lex/auth/page.tsx")).not.toContain("bg-black/40");
    expect(read("app/lex/staff/page.tsx")).not.toContain("divide-white");
    expect(read("app/lex/staff/page.tsx")).not.toContain("bg-blue-500");
    expect(read("components/careers/admin-careers-manager.tsx")).not.toContain(
      "divide-white",
    );
    expect(read("components/settings/account-center.tsx")).not.toContain(
      "border-red-200",
    );
  });

  it("exposes a single Light/Dark switch with no Auto or System option", () => {
    const toggle = read("components/theme/theme-toggle.tsx");
    expect(toggle).toContain('role="switch"');
    expect(toggle).toContain("Switch to light");
    expect(toggle).toContain("Switch to dark");
    expect(toggle).toContain('"Dark"');
    expect(toggle).toContain('"Light"');
    expect(toggle).not.toContain("radiogroup");
    expect(toggle).not.toContain('value: "auto"');
    expect(toggle).not.toContain("Automatic theme");
    expect(toggle).not.toContain("System");
    expect(toggle).not.toContain("next-themes");
    expect(toggle).not.toContain("onPointerDown");
  });

  it("puts the menu theme control in public and authenticated mobile navigation", () => {
    const navbar = read("components/navigation/navbar.tsx");
    expect(navbar).toContain('variant="menu"');
    expect(navbar).toContain("ThemeModeControl");
    expect(navbar).toContain("md:hidden");

    const header = read("components/shell/top-header.tsx");
    expect(header).toContain("ThemeModeControl");
    expect(header).toContain('variant="compact"');
    expect(header).toContain("hidden md:block");

    const profile = read("components/shell/profile-dropdown.tsx");
    expect(profile).toContain("ThemeModeControl");
    expect(profile).toContain('variant="menu"');
    expect(profile).toContain("md:hidden");
  });

  it("keeps role workspaces on semantic surfaces instead of hardcoded white/black", () => {
    const files = [
      "components/earner/dashboard-view.tsx",
      "components/hirer/dashboard-view.tsx",
      "components/admin/operations-view.tsx",
      "components/wallet/earner-wallet-view.tsx",
      "components/hirer/wallet-view.tsx",
      "components/settings/account-center.tsx",
    ];
    for (const file of files) {
      const source = read(file);
      expect(source, file).not.toContain("bg-white");
      expect(source, file).not.toContain("bg-black");
      expect(source, file).not.toContain("text-white");
    }
  });

  it("keeps overlays, menus, and toasts on semantic elevated surfaces", () => {
    expect(read("components/shell/profile-dropdown.tsx")).toContain("bg-elevated");
    expect(read("components/shell/notification-dropdown.tsx")).toContain(
      "bg-elevated",
    );
    expect(read("components/ui/toast.tsx")).toContain("bg-elevated");
    expect(read("components/ui/modal.tsx")).toContain("bg-card");
    expect(read("components/ui/modal.tsx")).toContain("bg-overlay");
    expect(read("components/ui/dropdown.tsx")).toContain("bg-card");
    expect(read("components/shell/bottom-nav.tsx")).toContain("bg-topbar");
    expect(read("components/shell/bottom-nav.tsx")).toContain("/admin");
    expect(read("components/shell/sidebar.tsx")).toContain("bg-sidebar");
    expect(read("components/shell/top-header.tsx")).toContain("headerWalletHref");
  });

  it("lets /otp inherit global theme tokens without a second theme control", () => {
    const otp = read("app/otp/page.tsx");
    expect(otp).toContain("bg-background");
    expect(otp).toContain("text-foreground");
    expect(otp).toContain("bg-input-background");
    expect(otp).not.toContain("ThemeModeControl");
    expect(otp).not.toContain("localStorage");
    expect(otp).not.toContain("prefers-color-scheme");
    expect(otp).not.toContain("next-themes");
  });

  it("keeps Wallet on Earner and Hirer nav and off Admin sidebar and bottom nav", () => {
    const sidebar = read("components/shell/sidebar.tsx");
    const bottom = read("components/shell/bottom-nav.tsx");
    const staffBlock = sidebar.slice(
      sidebar.indexOf("const staffItems"),
      sidebar.indexOf("const superAdminItems"),
    );
    const superBlock = sidebar.slice(
      sidebar.indexOf("const superAdminItems"),
      sidebar.indexOf("let navItems"),
    );
    const adminTabs = bottom.slice(
      bottom.indexOf("const adminTabs"),
      bottom.indexOf("const tabs"),
    );
    const earnerTabs = bottom.slice(
      bottom.indexOf("const earnerTabs"),
      bottom.indexOf("const hireTabs"),
    );
    const hireTabs = bottom.slice(
      bottom.indexOf("const hireTabs"),
      bottom.indexOf("const adminTabs"),
    );

    expect(sidebar).toContain('href: "/wallet"');
    expect(sidebar).toContain('href: "/hirer/wallet"');
    expect(staffBlock).not.toContain("Wallet");
    expect(superBlock).not.toContain("Wallet");
    expect(adminTabs).not.toContain("Wallet");
    expect(earnerTabs).toContain("Wallet");
    expect(hireTabs).toContain("Wallet");
  });
});

describe("edge proxy uses the shared access policy", () => {
  it("does not keep a second RBAC implementation in proxy.ts", () => {
    const proxy = read("proxy.ts");
    expect(proxy).toContain("decideProxyAccess");
    expect(proxy).not.toContain("function meetsAccess");
    expect(proxy).not.toContain("function getRoleHomePath");
  });
});

describe("test-user seed stays on env, not a hardcoded Auth host", () => {
  it("loads .env.local and does not embed a supabase project host", () => {
    const seed = read("scripts/seed-test-users.ts");
    expect(seed).toContain('.env.local');
    expect(seed).toContain("testadmin@zolanzo.com");
    expect(seed).toContain("testuser@zolanzo.com");
    expect(seed).toContain("hirertest@zolanzo.com");
    expect(seed).not.toMatch(/https:\/\/[a-z0-9]+\.supabase\.co/);
  });
});
