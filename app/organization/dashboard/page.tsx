"use client";

import React from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function OrganizationDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-6xl mx-auto space-y-8 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black">Organization Dashboard</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
              Verified Business
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Global Media Corp • Pan-African Campaign Manager</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/organization/campaigns/new"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-all min-h-[44px] flex items-center justify-center gap-2"
          >
            <Icons.add size={16} /> Create New Campaign
          </Link>
          <Link
            href="/organization/escrow"
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-xs transition-all min-h-[44px] flex items-center justify-center gap-2"
          >
            <Icons.escrow size={16} /> Escrow Pool ($2,500.00)
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Escrow Balance", val: "$2,500.00", icon: Icons.wallet, color: "text-emerald-400" },
          { label: "Active Campaigns", val: "4 Active", icon: Icons.jobs, color: "text-blue-400" },
          { label: "Pending Reviews", val: "12 Submissions", icon: Icons.verified, color: "text-amber-400" },
          { label: "Workers Deployed", val: "1,240 Workers", icon: Icons.teams, color: "text-purple-400" },
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

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/organization/reviews"
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-200 group-hover:text-emerald-400">Review Proofs (12)</h3>
            <Icons.forward size={16} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400">Approve worker proof & release Korapay escrow payouts</p>
        </Link>

        <Link
          href="/organization/escrow"
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-200 group-hover:text-emerald-400">Fund Escrow Wallet</h3>
            <Icons.coins size={16} className="text-emerald-400" />
          </div>
          <p className="text-zinc-400">Fund campaign budget via Korapay virtual account or card</p>
        </Link>

        <Link
          href="/organization/campaigns"
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-200 group-hover:text-emerald-400">Manage Campaigns</h3>
            <Icons.jobs size={16} className="text-purple-400" />
          </div>
          <p className="text-zinc-400">Monitor completion SLA and worker throughput</p>
        </Link>
      </div>

    </div>
  );
}
