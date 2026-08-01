"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
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
} from "@hugeicons/core-free-icons";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isHireWorkspace = pathname.startsWith("/hire");

  const earnerItems = [
    { label: "Home", href: "/earner/dashboard", icon: DashboardCircleIcon },
    { label: "Find Opportunities", href: "/tasks", icon: CursorPointer01Icon },
    { label: "Applications", href: "/applications", icon: ClipboardListIcon },
    { label: "Wallet", href: "/wallet", icon: Wallet01Icon },
    { label: "Activity", href: "/activity", icon: Clock01Icon },
    { label: "Invite Friends", href: "/referrals", icon: UserGroupIcon },
    { label: "Alerts", href: "/notifications", icon: Notification01Icon },
    { label: "Help", href: "/support", icon: HeadsetIcon },
    { label: "Settings", href: "/settings", icon: Settings01Icon },
  ];

  const hireItems = [
    { label: "Home", href: "/hire/dashboard", icon: DashboardCircleIcon },
    { label: "My Opportunities", href: "/hire/opportunities", icon: CursorPointer01Icon },
    { label: "Applications", href: "/hire/applications", icon: ClipboardListIcon },
    { label: "Workers", href: "/hire/workers", icon: UserCheck01Icon },
    { label: "Wallet", href: "/hire/wallet", icon: Wallet01Icon },
    { label: "Analytics", href: "/hire/analytics", icon: AnalyticsUpIcon },
    { label: "Company", href: "/hire/company", icon: Building01Icon },
    { label: "Team", href: "/hire/team", icon: UserGroupIcon },
    { label: "Alerts", href: "/notifications", icon: Notification01Icon },
    { label: "Help", href: "/support", icon: HeadsetIcon },
    { label: "Settings", href: "/hire/settings", icon: Settings01Icon },
  ];

  const navItems = isHireWorkspace ? hireItems : earnerItems;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors
    }
    router.push("/login");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#04090B] border-r border-white/10 h-screen sticky top-0 shrink-0 select-none">
      {/* Top Logo */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link href="/">
          <Image
            src="/brand/dark-theme-logo.webp"
            alt="ZOLANZO Logo"
            width={130}
            height={32}
            className="h-[30px] w-auto object-contain"
          />
        </Link>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
          isHireWorkspace ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}>
          {isHireWorkspace ? "HIRE WORKSPACE" : "EARN WORKSPACE"}
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {isHireWorkspace ? "Employer Menu" : "Earner Menu"}
          </span>
          
          <Link
            href={isHireWorkspace ? "/earner/dashboard" : "/hire/dashboard"}
            className="text-[10px] text-zinc-400 hover:text-white font-semibold underline"
          >
            Switch to {isHireWorkspace ? "Earn" : "Hire"}
          </Link>
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/earner/dashboard" && item.href !== "/hire/dashboard" && pathname.startsWith(`${item.href}`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                isActive
                  ? isHireWorkspace
                    ? "bg-purple-500/15 border border-purple-500/40 text-purple-400"
                    : "bg-[#008744]/15 border border-[#008744]/40 text-emerald-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/80"
              }`}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                className={isActive ? (isHireWorkspace ? "text-purple-400" : "text-emerald-400") : "text-zinc-400 group-hover:text-white"}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Logout Button */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
