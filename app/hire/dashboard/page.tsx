"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  CircleLock01Icon,
  CursorPointer01Icon,
  ClipboardListIcon,
  UserCheck01Icon,
  Coins01Icon,
  UserGroupIcon,
  PlusSignIcon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function HireDashboardPage() {
  const metrics = [
    { label: "Available Balance", value: "₦450,000", sub: "Ready for Campaign Escrow", icon: Wallet01Icon, color: "text-white" },
    { label: "Escrow Balance", value: "₦312,000", sub: "Protected & Locked", icon: CircleLock01Icon, color: "text-purple-400" },
    { label: "Active Opportunities", value: "8 Active", sub: "Currently Hiring", icon: CursorPointer01Icon, color: "text-emerald-400" },
    { label: "Awaiting Review", value: "24 Pending", sub: "Action Required Today", icon: ClipboardListIcon, color: "text-amber-400" },
    { label: "Workers Active", value: "1,420", sub: "Verified Contributors", icon: UserCheck01Icon, color: "text-blue-400" },
    { label: "Lifetime Spend", value: "₦3,480,000", sub: "100% Escrow Funded", icon: Coins01Icon, color: "text-zinc-300" },
  ];

  const recentActivity = [
    { title: "24 Applications Submitted for AI Model Labeling", time: "10 mins ago", type: "Applications", link: "/hire/applications" },
    { title: "Escrow Lock: ₦150,000 allocated for Fintech Survey", time: "1 hour ago", type: "Escrow", link: "/hire/wallet" },
    { title: "Campaign Goal Reached: 500/500 Slots Filled", time: "3 hours ago", type: "Opportunity", link: "/hire/opportunities" },
    { title: "Team Member Added: Samuel K. (Campaign Manager)", time: "Yesterday", type: "Team", link: "/hire/team" },
  ];

  return (
    <AppShell userName="Amina" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1440px] mx-auto space-y-8 pb-20">
        
        {/* Top Header & Quick Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Employer Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                Kora AI Labs • Verified Employer
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Create digital opportunities, lock campaign escrow, review worker submissions, and monitor workforce analytics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/hire/opportunities/new"
              className="h-[44px] px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-[1px]"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              <span>Create Opportunity</span>
            </Link>

            <Link
              href="/hire/wallet"
              className="h-[44px] px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <HugeiconsIcon icon={Wallet01Icon} size={16} />
              <span>Fund Wallet</span>
            </Link>

            <Link
              href="/hire/applications"
              className="h-[44px] px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <HugeiconsIcon icon={ClipboardListIcon} size={16} />
              <span>Review (24)</span>
            </Link>
          </div>
        </div>

        {/* 6 Financial & Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-[#0A0F12] border border-white/10 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{m.label}</span>
                <HugeiconsIcon icon={m.icon} size={16} className={m.color} />
              </div>
              <span className={`text-xl sm:text-2xl font-black block ${m.color}`}>{m.value}</span>
              <span className="text-[10px] text-zinc-400 font-medium block">{m.sub}</span>
            </div>
          ))}
        </div>

        {/* Campaign Analytics Overview & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Campaign Progress Banner */}
          <div className="lg:col-span-2 bg-[#04090B] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Campaign Progress</h3>
              </div>
              <Link href="/hire/analytics" className="text-xs font-bold text-purple-400 hover:underline">
                Full Analytics →
              </Link>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">AI Model Dataset Image Labeling</span>
                  <span className="text-emerald-400 font-mono">85% Complete (850 / 1,000)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-emerald-400 rounded-full w-[85%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Reward: ₦850 / item</span>
                  <span>Escrow: ₦150,000 Remaining</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">Mobile Banking Usability Survey</span>
                  <span className="text-purple-400 font-mono">42% Complete (210 / 500)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full w-[42%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Reward: ₦1,200 / item</span>
                  <span>Escrow: ₦348,000 Remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Activity & Quick Actions */}
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today&apos;s Feed</h3>
              <HugeiconsIcon icon={Notification01Icon} size={16} className="text-purple-400" />
            </div>

            <div className="space-y-3">
              {recentActivity.map((act, i) => (
                <Link
                  key={i}
                  href={act.link}
                  className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition-colors block space-y-1 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white group-hover:text-purple-400 transition-colors leading-snug">{act.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium block">{act.time} • {act.type}</span>
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <Link
                href="/hire/team"
                className="w-full h-[40px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <HugeiconsIcon icon={UserGroupIcon} size={16} />
                <span>Invite Team Member</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
