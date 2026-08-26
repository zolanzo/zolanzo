"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveShellChrome } from "@/lib/workspace/shell-nav";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardCircleIcon,
  CursorPointer01Icon,
  Wallet01Icon,
  UserIcon,
  ClipboardListIcon,
  UserGroupIcon,
  ShieldKeyIcon,
  HeadsetIcon,
  Settings01Icon,
  Briefcase01Icon,
} from "@hugeicons/core-free-icons";

export function BottomNav({ userRole = null }: { userRole?: string | null }) {
  const pathname = usePathname();
  const chrome = resolveShellChrome(pathname, userRole);
  const isHireWorkspace = chrome === "hirer";

  const earnerTabs = [
    { label: "Home", href: "/earner/dashboard", icon: DashboardCircleIcon },
    { label: "Tasks", href: "/tasks", icon: CursorPointer01Icon },
    { label: "Wallet", href: "/wallet", icon: Wallet01Icon },
    { label: "Applied", href: "/applications", icon: ClipboardListIcon },
    { label: "Profile", href: "/profile", icon: UserIcon },
  ];

  const hireTabs = [
    { label: "Home", href: "/hirer/dashboard", icon: DashboardCircleIcon },
    { label: "Campaigns", href: "/hirer/opportunities", icon: CursorPointer01Icon },
    { label: "Review", href: "/hirer/applications", icon: ClipboardListIcon },
    { label: "Wallet", href: "/hirer/wallet", icon: Wallet01Icon },
    { label: "Team", href: "/hirer/team", icon: UserGroupIcon },
  ];

  const adminTabs = [
    { label: "Ops", href: "/admin", icon: DashboardCircleIcon },
    { label: "Staff", href: "/lex/staff", icon: UserGroupIcon },
    { label: "Admin", href: "/lex/auth", icon: ShieldKeyIcon },
    { label: "Support", href: "/support", icon: HeadsetIcon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  const staffTabs = [
    { label: "Ops", href: "/lex/staff", icon: DashboardCircleIcon },
    { label: "Careers", href: "/careers", icon: Briefcase01Icon },
    { label: "Support", href: "/support", icon: HeadsetIcon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  const tabs =
    chrome === "super_admin"
      ? adminTabs
      : chrome === "staff"
        ? staffTabs
        : isHireWorkspace
          ? hireTabs
          : earnerTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 select-none border-t border-border bg-topbar px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
      aria-label="Primary"
    >
      <div
        className={`mx-auto grid max-w-md gap-0.5 ${
          tabs.length === 4 ? "grid-cols-4" : "grid-cols-5"
        }`}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/earner/dashboard" &&
              tab.href !== "/hirer/dashboard" &&
              tab.href !== "/admin" &&
              tab.href !== "/lex/staff" &&
              tab.href !== "/lex/auth" &&
              pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-11 flex-col items-center justify-center rounded-xl px-0.5 ${
                isActive
                  ? "font-bold text-primary"
                  : "font-semibold text-muted-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={tab.icon}
                size={20}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span className="text-[10px] mt-0.5 leading-none truncate max-w-[68px] text-center">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
