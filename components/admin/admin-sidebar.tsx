"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardCircleIcon,
  UserGroupIcon,
  UserCheck01Icon,
  CursorPointer01Icon,
  ClipboardListIcon,
  Wallet01Icon,
  CircleLock01Icon,
  Coins01Icon,
  AlertCircleIcon,
  Shield01Icon,
  Notification01Icon,
  Download01Icon,
  ActivityIcon,
  Settings01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navGroups = [
    {
      title: "Core Operations",
      items: [
        { label: "Overview", href: "/admin/overview", icon: DashboardCircleIcon },
        { label: "Users Directory", href: "/admin/users", icon: UserGroupIcon },
        { label: "Earners", href: "/admin/earners", icon: UserCheck01Icon },
        { label: "Hirers", href: "/admin/hirers", icon: UserGroupIcon },
        { label: "Opportunities", href: "/admin/opportunities", icon: CursorPointer01Icon },
        { label: "Applications", href: "/admin/applications", icon: ClipboardListIcon },
      ],
    },
    {
      title: "Finance & Escrow",
      items: [
        { label: "Wallets & Ledger", href: "/admin/wallets", icon: Wallet01Icon },
        { label: "Platform Escrow", href: "/admin/escrow", icon: CircleLock01Icon },
        { label: "Withdrawals Queue", href: "/admin/withdrawals", icon: Coins01Icon },
        { label: "Revenue & Fees", href: "/admin/revenue", icon: Coins01Icon },
      ],
    },
    {
      title: "Trust & Safety",
      items: [
        { label: "Disputes Center", href: "/admin/disputes", icon: AlertCircleIcon },
        { label: "Verifications (NIN)", href: "/admin/verifications", icon: Shield01Icon },
        { label: "Moderation & Anti-Abuse", href: "/admin/moderation", icon: Shield01Icon },
        { label: "Broadcast Alerts", href: "/admin/notifications", icon: Notification01Icon },
      ],
    },
    {
      title: "System & Governance",
      items: [
        { label: "Reports Generator", href: "/admin/reports", icon: Download01Icon },
        { label: "System Health", href: "/admin/system", icon: ActivityIcon },
        { label: "Audit Logs", href: "/admin/audit", icon: ActivityIcon },
        { label: "Global Settings", href: "/admin/settings", icon: Settings01Icon },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-[#020507] border-r border-white/10 h-screen sticky top-0 shrink-0 select-none flex flex-col">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link href="/admin/overview">
          <Image
            src="/brand/dark-theme-logo.webp"
            alt="ZOLANZO Logo"
            width={120}
            height={30}
            className="h-[28px] w-auto object-contain"
          />
        </Link>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/30">
          MISSION CONTROL
        </span>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              {group.title}
            </span>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin/overview" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? "bg-red-500/15 border border-red-500/30 text-red-400 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/80"
                  }`}
                >
                  <HugeiconsIcon icon={item.icon} size={16} className={isActive ? "text-red-400" : "text-zinc-500"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Logout01Icon} size={16} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}
