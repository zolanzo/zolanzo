"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeLogo } from "@/components/brand/theme-logo";
import { resolveShellChrome, type ShellChrome } from "@/lib/workspace/shell-nav";
import {
  DashboardCircleIcon,
  CursorPointer01Icon,
  Wallet01Icon,
  ClipboardListIcon,
  UserGroupIcon,
  HeadsetIcon,
  Settings01Icon,
  Logout01Icon,
  Clock01Icon,
  AnalyticsUpIcon,
  Building01Icon,
  UserCheck01Icon,
  ShieldKeyIcon,
  Briefcase01Icon,
} from "@hugeicons/core-free-icons";

export function Sidebar({ userRole = null }: { userRole?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const chrome: ShellChrome = resolveShellChrome(pathname, userRole);
  const isSuperAdmin = chrome === "super_admin";
  const isStaff = chrome === "staff";
  const isHirer = chrome === "hirer";

  const earnerItems = [
    { label: "Dashboard", href: "/earner/dashboard", icon: DashboardCircleIcon },
    { label: "Tasks", href: "/tasks", icon: CursorPointer01Icon },
    { label: "Applications", href: "/applications", icon: ClipboardListIcon },
    { label: "Wallet", href: "/wallet", icon: Wallet01Icon },
    { label: "Profile", href: "/profile", icon: UserCheck01Icon },
    { label: "Activity", href: "/activity", icon: Clock01Icon },
    { label: "Referrals", href: "/referrals", icon: UserGroupIcon },
    { label: "Support", href: "/support", icon: HeadsetIcon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  const hirerItems = [
    { label: "Dashboard", href: "/hirer/dashboard", icon: DashboardCircleIcon },
    { label: "Campaigns", href: "/hirer/opportunities", icon: CursorPointer01Icon },
    { label: "Review", href: "/hirer/applications", icon: ClipboardListIcon },
    { label: "Workers", href: "/hirer/workers", icon: UserCheck01Icon },
    { label: "Wallet", href: "/hirer/wallet", icon: Wallet01Icon },
    { label: "Results", href: "/hirer/analytics", icon: AnalyticsUpIcon },
    { label: "Company", href: "/hirer/company", icon: Building01Icon },
    { label: "Team", href: "/hirer/team", icon: UserGroupIcon },
    { label: "Support", href: "/support", icon: HeadsetIcon },
    { label: "Settings", href: "/hirer/settings", icon: Settings01Icon },
  ];

  const staffItems = [
    { label: "Operations", href: "/admin", icon: DashboardCircleIcon },
    { label: "Staff", href: "/lex/staff", icon: UserGroupIcon },
    { label: "Careers", href: "/careers", icon: Briefcase01Icon },
    { label: "Support", href: "/support", icon: HeadsetIcon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  const superAdminItems = [
    { label: "Operations", href: "/admin", icon: DashboardCircleIcon },
    { label: "Super admin", href: "/lex/auth", icon: ShieldKeyIcon },
    { label: "Staff", href: "/lex/staff", icon: UserGroupIcon },
    { label: "Careers", href: "/careers", icon: Briefcase01Icon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  let navItems = earnerItems;
  let workspaceTitle = "Menu";

  if (isSuperAdmin) {
    navItems = superAdminItems;
    workspaceTitle = "Admin";
  } else if (isStaff) {
    navItems = staffItems;
    workspaceTitle = "Admin";
  } else if (isHirer) {
    navItems = hirerItems;
    workspaceTitle = "Hirer";
  } else {
    workspaceTitle = "Earner";
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors
    }
    router.push("/login");
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 select-none flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-5">
        <Link href="/" aria-label="Zolanzo home">
          <ThemeLogo className="h-[26px] w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Primary">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {workspaceTitle}
        </p>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/earner/dashboard" &&
              item.href !== "/hirer/dashboard" &&
              item.href !== "/lex/staff" &&
              item.href !== "/lex/auth" &&
              item.href !== "/admin" &&
              pathname.startsWith(`${item.href}`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold ${
                isActive
                  ? isHirer
                    ? "border border-accent/35 bg-accent/15 text-accent"
                    : isSuperAdmin
                      ? "border border-danger/35 bg-danger/15 text-danger"
                      : isStaff
                        ? "border border-info/35 bg-info/15 text-info"
                        : "border border-primary/35 bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10"
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
