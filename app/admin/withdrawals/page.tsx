"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminWithdrawalsPage() {
  const [queue, setQueue] = useState([
    { id: "wd_101", worker: "Grace Adebayo", bank: "GTBank (012****890)", amount: "₦18,400", status: "Pending", ref: "TX_ZOL98104", requestedAt: "10 mins ago" },
    { id: "wd_102", worker: "Chidi Okonkwo", bank: "Zenith Bank (211****401)", amount: "₦42,000", status: "Pending", ref: "TX_ZOL98105", requestedAt: "25 mins ago" },
    { id: "wd_103", worker: "Fatima Bello", bank: "Kuda Bank (201****902)", amount: "₦12,500", status: "Completed", ref: "TX_ZOL98106", requestedAt: "2 hours ago" },
  ]);

  const approveWithdrawal = (id: string) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "Completed" } : q))
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
                Withdrawals & Payout Queue
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/30">
                {queue.filter((q) => q.status === "Pending").length} Pending Disbursal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Approve bank transfers, retry failed NIBSS transactions, or reverse disbursements.
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
                  <th className="p-4">Worker</th>
                  <th className="p-4">Bank Payout Account</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Reference Code</th>
                  <th className="p-4">Requested</th>
                  <th className="p-4 text-right">Disbursement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {queue.map((q) => (
                  <tr key={q.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        q.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{q.worker}</td>
                    <td className="p-4 text-zinc-300 font-medium">{q.bank}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{q.amount}</td>
                    <td className="p-4 font-mono text-zinc-400">{q.ref}</td>
                    <td className="p-4 text-zinc-400">{q.requestedAt}</td>
                    <td className="p-4 text-right">
                      {q.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => approveWithdrawal(q.id)}
                          className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        >
                          Approve Korapay Disbursal
                        </button>
                      )}
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
