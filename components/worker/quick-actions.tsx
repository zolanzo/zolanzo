"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CursorPointer01Icon,
  ClipboardListIcon,
  Wallet01Icon,
  UserGroupIcon,
  HeadsetIcon,
} from "@hugeicons/core-free-icons";

export function QuickActions() {
  const actions = [
    { label: "Browse Tasks", href: "#recommended-tasks", icon: CursorPointer01Icon, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Submissions", href: "#submissions", icon: ClipboardListIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Wallet", href: "#wallet", icon: Wallet01Icon, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Referrals", href: "#referrals", icon: UserGroupIcon, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Support", href: "#support", icon: HeadsetIcon, color: "text-teal-400", bg: "bg-teal-500/10" },
  ];

  return (
    <div className="w-full">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {actions.map((act, i) => (
          <Link
            key={i}
            href={act.href}
            className="p-3.5 rounded-2xl bg-[#0A0F12] border border-white/10 hover:border-zinc-700 hover:-translate-y-[2px] transition-all duration-200 flex flex-col items-center justify-center text-center space-y-2 group shadow-sm"
          >
            <div className={`w-9 h-9 rounded-xl ${act.bg} ${act.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
              <HugeiconsIcon icon={act.icon} size={20} />
            </div>
            <span className="text-xs font-bold text-zinc-200 group-hover:text-white leading-tight">
              {act.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
