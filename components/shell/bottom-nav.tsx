"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardCircleIcon,
  CursorPointer01Icon,
  Wallet01Icon,
  Notification01Icon,
  UserIcon,
  ClipboardListIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

export function BottomNav() {
  const pathname = usePathname();
  const isHireWorkspace = pathname.startsWith("/hire");

  const earnerTabs = [
    { label: "Home", href: "/earner/dashboard", icon: DashboardCircleIcon },
    { label: "Opportunities", href: "/tasks", icon: CursorPointer01Icon },
    { label: "Wallet", href: "/wallet", icon: Wallet01Icon },
    { label: "Alerts", href: "/notifications", icon: Notification01Icon },
    { label: "Profile", href: "/profile", icon: UserIcon },
  ];

  const hireTabs = [
    { label: "Home", href: "/hire/dashboard", icon: DashboardCircleIcon },
    { label: "Opportunities", href: "/hire/opportunities", icon: CursorPointer01Icon },
    { label: "Applications", href: "/hire/applications", icon: ClipboardListIcon },
    { label: "Wallet", href: "/hire/wallet", icon: Wallet01Icon },
    { label: "Team", href: "/hire/team", icon: UserGroupIcon },
  ];

  const tabs = isHireWorkspace ? hireTabs : earnerTabs;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#04090B]/95 border-t border-white/10 backdrop-blur-xl px-2 py-2 select-none">
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/earner/dashboard" && tab.href !== "/hire/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                isActive
                  ? isHireWorkspace
                    ? "text-purple-400 font-bold"
                    : "text-emerald-400 font-bold"
                  : "text-zinc-500 hover:text-zinc-300 font-semibold"
              }`}
            >
              <HugeiconsIcon
                icon={tab.icon}
                size={20}
                className={isActive ? (isHireWorkspace ? "text-purple-400" : "text-emerald-400") : "text-zinc-500"}
              />
              <span className="text-[10px] mt-1 leading-none truncate max-w-[64px] text-center">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
