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
    { label: "Browse Tasks", href: "#recommended-tasks", icon: CursorPointer01Icon, color: "text-primary", bg: "bg-primary-subtle" },
    { label: "Submissions", href: "#submissions", icon: ClipboardListIcon, color: "text-info", bg: "bg-info/10" },
    { label: "Wallet", href: "#wallet", icon: Wallet01Icon, color: "text-warning", bg: "bg-warning/10" },
    { label: "Referrals", href: "#referrals", icon: UserGroupIcon, color: "text-accent", bg: "bg-accent-subtle" },
    { label: "Support", href: "#support", icon: HeadsetIcon, color: "text-accent", bg: "bg-accent-subtle" },
  ];

  return (
    <div className="w-full">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {actions.map((act, i) => (
          <Link
            key={i}
            href={act.href}
            className="group flex flex-col items-center justify-center space-y-2 rounded-2xl border border-border bg-card p-3.5 text-center shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${act.bg} ${act.color} transition-transform group-hover:scale-105`}
            >
              <HugeiconsIcon icon={act.icon} size={20} />
            </div>
            <span className="text-xs font-bold leading-tight text-foreground group-hover:text-primary">
              {act.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
