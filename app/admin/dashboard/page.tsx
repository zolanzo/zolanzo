"use client";

import React from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-6xl mx-auto space-y-8 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-amber-400">Admin Control Center</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Platform Moderation, Escrow Audit & Korapay Disbursement Control</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payouts"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all min-h-[44px] flex items-center justify-center gap-2"
          >
            <Icons.withdrawal size={16} /> Payout Approvals (3 Pending)
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Platform Volume", val: "$142,500", icon: Icons.coins, color: "text-emerald-400" },
          { label: "Escrow Locked Pool", val: "$34,200", icon: Icons.escrow, color: "text-amber-400" },
          { label: "Active Workers", val: "21,450", icon: Icons.teams, color: "text-blue-400" },
          { label: "Active Organizations", val: "480 Orgs", icon: Icons.organization, color: "text-purple-400" },
        ].map(({ label, val, icon: IconComp, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span>{label}</span>
              <IconComp size={18} className={color} />
            </div>
            <div className="text-2xl font-black tracking-tight">{val}</div>
          </div>
        ))}
      </div>

      {/* Admin Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/users" className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 space-y-2">
          <div className="font-bold text-sm text-zinc-200">User & KYC Verification</div>
          <p className="text-zinc-400">Review worker identity documents and trust scores</p>
        </Link>
        <Link href="/admin/campaigns" className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 space-y-2">
          <div className="font-bold text-sm text-zinc-200">Campaign Moderation</div>
          <p className="text-zinc-400">Approve organization task briefs & campaign guidelines</p>
        </Link>
        <Link href="/admin/payouts" className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 space-y-2">
          <div className="font-bold text-sm text-zinc-200">Korapay Payout Approvals</div>
          <p className="text-zinc-400">Audit withdrawal queues & approve high-value payouts</p>
        </Link>
      </div>

    </div>
  );
}
