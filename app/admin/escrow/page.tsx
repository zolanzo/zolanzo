"use client";

import React from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminEscrowPage() {
  const escrows = [
    { campaignId: "opp_101", title: "AI Model Image Dataset Annotation", employer: "Kora AI Labs", locked: "₦794,750", released: "₦722,500", status: "PARTIALLY_RELEASED" },
    { campaignId: "opp_102", title: "Mobile Banking Usability Survey", employer: "Fintech Startup", locked: "₦348,000", released: "₦252,000", status: "PARTIALLY_RELEASED" },
    { campaignId: "opp_103", title: "Customer Support Live Chat", employer: "Intercom Inc", locked: "₦50,000", released: "₦40,000", status: "PARTIALLY_RELEASED" },
  ];

  return (
    <AdminShell>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Platform Escrow Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-bold border border-purple-500/30">
                ₦312,400,000 Total Escrow Held
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Audit corporate escrow locks, partial release balances, platform fees, and refunds.
            </p>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#04090B] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Escrow Locked</span>
            <span className="text-2xl font-black text-purple-400 block">₦312,400,000</span>
            <span className="text-[11px] text-purple-400 font-bold">100% Reserve Backed</span>
          </div>

          <div className="bg-[#04090B] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Released to Earners</span>
            <span className="text-2xl font-black text-emerald-400 block">₦1,014,500,000</span>
            <span className="text-[11px] text-emerald-400 font-bold">Disbursed Successfully</span>
          </div>

          <div className="bg-[#04090B] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Net Platform Revenue (10%)</span>
            <span className="text-2xl font-black text-white block">₦45,200,000</span>
            <span className="text-[11px] text-zinc-400">Escrow Fee Accruals</span>
          </div>

          <div className="bg-[#04090B] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Refunded to Hirers</span>
            <span className="text-2xl font-black text-amber-400 block">₦12,300,000</span>
            <span className="text-[11px] text-zinc-400">Unused Escrow Refunds</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#04090B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Escrow Status</th>
                  <th className="p-4">Campaign ID</th>
                  <th className="p-4">Opportunity Title</th>
                  <th className="p-4">Employer Company</th>
                  <th className="p-4">Total Escrow Locked</th>
                  <th className="p-4">Released Payouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {escrows.map((e) => (
                  <tr key={e.campaignId} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-white">{e.campaignId}</td>
                    <td className="p-4 font-bold text-white">{e.title}</td>
                    <td className="p-4 text-purple-400 font-bold">{e.employer}</td>
                    <td className="p-4 font-mono font-bold text-purple-400">{e.locked}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{e.released}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
