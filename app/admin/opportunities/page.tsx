"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([
    { id: "opp_101", title: "AI Model Image Dataset Annotation", employer: "Kora AI Labs", reward: "₦850", slots: "850 / 1000", status: "Live", escrow: "₦794,750" },
    { id: "opp_102", title: "Mobile Banking Usability Survey", employer: "Fintech Startup", reward: "₦1,200", slots: "210 / 500", status: "Live", escrow: "₦348,000" },
    { id: "opp_103", title: "Customer Support Live Chat", employer: "Intercom Inc", reward: "₦5,000", slots: "10 / 20", status: "Paused", escrow: "₦50,000" },
  ]);

  const togglePause = (id: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: o.status === "Live" ? "Paused" : "Live" } : o))
    );
  };

  return (
    <AdminShell>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Opportunities Moderation Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/30">
                1,850 Live Campaigns
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Approve, pause, archive, pin, or force close opportunities across ZOLANZO marketplace.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#04090B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Status</th>
                  <th className="p-4">Opportunity Title</th>
                  <th className="p-4">Employer Company</th>
                  <th className="p-4">Reward / Slot</th>
                  <th className="p-4">Slots Filled</th>
                  <th className="p-4">Escrow Locked</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        opp.status === "Live" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {opp.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{opp.title}</td>
                    <td className="p-4 text-purple-400 font-bold">{opp.employer}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{opp.reward}</td>
                    <td className="p-4 font-bold text-zinc-300">{opp.slots}</td>
                    <td className="p-4 font-mono font-bold text-white">{opp.escrow}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => togglePause(opp.id)}
                        className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                      >
                        {opp.status === "Live" ? "Pause" : "Resume"}
                      </button>
                    </td>
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
