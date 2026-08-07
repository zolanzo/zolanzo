"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeLogo } from "@/components/brand/theme-logo";
import {
  DashboardCircleIcon,
  CursorPointer01Icon,
  Wallet01Icon,
  ClipboardListIcon,
  UserGroupIcon,
  Notification01Icon,
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isSuperAdmin = pathname.startsWith("/lex/auth");
  const isStaff = pathname.startsWith("/lex/staff");
  const isHirer = pathname.startsWith("/hirer");

  const earnerItems = [
    { label: "Dashboard", href: "/earner/dashboard", icon: DashboardCircleIcon },
    { label: "Tasks", href: "/tasks", icon: CursorPointer01Icon },
    { label: "Applications", href: "/applications", icon: ClipboardListIcon },
    { label: "Wallet", href: "/wallet", icon: Wallet01Icon },
    { label: "Activity", href: "/activity", icon: Clock01Icon },
    { label: "Referrals", href: "/referrals", icon: UserGroupIcon },
    { label: "Support", href: "/support", icon: HeadsetIcon },
    { label: "My Reputation", href: "/profile", icon: UserCheck01Icon },
    { label: "My Settings", href: "/settings", icon: Settings01Icon },
  ];

  const hirerItems = [
    { label: "Dashboard", href: "/hirer/dashboard", icon: DashboardCircleIcon },
    { label: "Campaign Opportunities", href: "/hirer/opportunities", icon: CursorPointer01Icon },
    { label: "Applications Received", href: "/hirer/applications", icon: ClipboardListIcon },
    { label: "Earners Directory", href: "/hirer/workers", icon: UserCheck01Icon },
    { label: "Escrow Wallet", href: "/hirer/wallet", icon: Wallet01Icon },
    { label: "Campaign Analytics", href: "/hirer/analytics", icon: AnalyticsUpIcon },
    { label: "Company Profile", href: "/hirer/company", icon: Building01Icon },
    { label: "Team Access", href: "/hirer/team", icon: UserGroupIcon },
    { label: "Alerts", href: "/notifications", icon: Notification01Icon },
    { label: "Support", href: "/support", icon: HeadsetIcon },
    { label: "Workspace Settings", href: "/hirer/settings", icon: Settings01Icon },
  ];

  const staffItems = [
    { label: "Staff Portal Home", href: "/lex/staff", icon: DashboardCircleIcon },
    { label: "Support Tickets", href: "/support", icon: HeadsetIcon },
    { label: "Careers ATS", href: "/careers", icon: Briefcase01Icon },
    { label: "Alerts", href: "/notifications", icon: Notification01Icon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  const superAdminItems = [
    { label: "Super Admin Command Center", href: "/lex/auth", icon: ShieldKeyIcon },
    { label: "Staff Roster & Oversight", href: "/lex/staff", icon: UserGroupIcon },
    { label: "Careers Manager", href: "/careers", icon: Briefcase01Icon },
    { label: "System Alerts", href: "/notifications", icon: Notification01Icon },
    { label: "Platform Settings", href: "/settings", icon: Settings01Icon },
  ];

  let navItems = earnerItems;
  let workspaceTitle = "Earner Menu";

  if (isSuperAdmin) {
    navItems = superAdminItems;
    workspaceTitle = "Super Admin Control";
  } else if (isStaff) {
    navItems = staffItems;
    workspaceTitle = "Staff Workspace";
  } else if (isHirer) {
    navItems = hirerItems;
    workspaceTitle = "Hirer Menu";
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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 select-none flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
      {/* Top Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <Link href="/">
          <ThemeLogo className="h-[30px] w-auto object-contain" />
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {workspaceTitle}
          </span>
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/earner/dashboard" && item.href !== "/hirer/dashboard" && item.href !== "/lex/staff" && item.href !== "/lex/auth" && pathname.startsWith(`${item.href}`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? isHirer
                    ? "bg-emerald-500/15 border border-emerald-500/35 text-emerald-400"
                    : isSuperAdmin
                    ? "bg-rose-500/15 border border-rose-500/35 text-rose-400"
                    : isStaff
                    ? "bg-blue-500/15 border border-blue-500/35 text-blue-400"
                    : "bg-primary/15 border border-primary/35 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/80"
              }`}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                className={
                  isActive
                    ? isHirer
                      ? "text-emerald-400"
                      : isSuperAdmin
                      ? "text-rose-400"
                      : isStaff
                      ? "text-blue-400"
                      : "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Logout Button */}
      <div className="shrink-0 border-t border-border p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-danger transition-colors hover:bg-danger/10"
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
