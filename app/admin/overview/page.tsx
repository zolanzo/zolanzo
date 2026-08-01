"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  UserCheck01Icon,
  CursorPointer01Icon,
  CircleLock01Icon,
  Coins01Icon,
  ActivityIcon,
} from "@hugeicons/core-free-icons";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminOverviewPage() {
  const kpis = [
    { label: "Total Platform Users", value: "102,450", sub: "4,210 Online Now", icon: UserGroupIcon, color: "text-white" },
    { label: "Total Earners", value: "92,000", sub: "Verified Workforce", icon: UserCheck01Icon, color: "text-emerald-400" },
    { label: "Total Employers / Hirers", value: "10,450", sub: "Active Companies", icon: UserGroupIcon, color: "text-purple-400" },
    { label: "Live Opportunities", value: "1,850", sub: "Escrow Funded", icon: CursorPointer01Icon, color: "text-amber-400" },
    { label: "Platform Escrow Locked", value: "₦312,400,000", sub: "100% Protected", icon: CircleLock01Icon, color: "text-purple-400" },
    { label: "Net Platform Revenue", value: "₦45,200,000", sub: "10% Fee Accruals", icon: Coins01Icon, color: "text-emerald-400" },
  ];

  const liveIncidents = [
    { title: "Korapay Payout Gateway Operational", status: "Healthy", latency: "140ms" },
    { title: "Supabase Realtime Cluster", status: "Healthy", latency: "22ms" },
    { title: "NIMC NIN Verification API", status: "Healthy", latency: "310ms" },
    { title: "Twilio SMS & OTP Gateway", status: "Healthy", latency: "180ms" },
  ];

  return (
    <AdminShell>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Ecosystem Mission Control
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/30">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Global operations dashboard for ZOLANZO ecosystem management, escrow auditing, and user governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="h-[40px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <HugeiconsIcon icon={UserGroupIcon} size={16} />
              <span>Manage Users</span>
            </Link>

            <Link
              href="/admin/escrow"
              className="h-[40px] px-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2"
            >
              <HugeiconsIcon icon={CircleLock01Icon} size={16} />
              <span>Audit Escrow</span>
            </Link>
          </div>
        </div>

        {/* 6 Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="bg-[#04090B] border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{k.label}</span>
                <HugeiconsIcon icon={k.icon} size={16} className={k.color} />
              </div>
              <span className={`text-xl sm:text-2xl font-black block ${k.color}`}>{k.value}</span>
              <span className="text-[10px] text-zinc-400 font-medium block">{k.sub}</span>
            </div>
          ))}
        </div>

        {/* Infrastructure & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Live Activity Feed */}
          <div className="lg:col-span-2 bg-[#04090B] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Platform Audit Event Stream</h3>
              </div>
              <Link href="/admin/audit" className="text-xs font-bold text-red-400 hover:underline">
                View Audit Logs →
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Disbursement Approved: ₦18,400 to GTBank</p>
                  <p className="text-[10px] text-zinc-400">Worker: Grace Adebayo • Ref: TX_ZOL98104</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">10s ago</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Escrow Locked: ₦794,750 for Campaign #opp_101</p>
                  <p className="text-[10px] text-zinc-400">Employer: Kora AI Labs • 1,000 slots</p>
                </div>
                <span className="text-[10px] text-purple-400 font-mono font-bold">1m ago</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">NIN Verification Completed</p>
                  <p className="text-[10px] text-zinc-400">User: Chidi Okonkwo • NIMC Verified</p>
                </div>
                <span className="text-[10px] text-blue-400 font-mono font-bold">3m ago</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-[#04090B] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Health</h3>
              <HugeiconsIcon icon={ActivityIcon} size={16} className="text-emerald-400" />
            </div>

            <div className="space-y-2.5">
              {liveIncidents.map((inc, i) => (
                <div key={i} className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{inc.title}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Latency: {inc.latency}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    {inc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </AdminShell>
  );
}
