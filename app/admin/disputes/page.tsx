"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([
    { id: "dsp_1", worker: "Grace A.", employer: "Kora AI Labs", issue: "Worker claims rejected evidence was valid bounding boxes", amount: "₦850", status: "Open" },
  ]);

  const resolveDispute = (id: string) => {
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: "Resolved" } : d)));
  };

  return (
    <AdminShell>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Disputes Resolution Center</h1>
          <p className="text-xs text-zinc-400">Arbitrate disputes between Earner workers and Hirer employers.</p>
        </div>

        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id} className="p-5 rounded-3xl bg-[#04090B] border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-red-400">Dispute #{d.id} • {d.status}</span>
                <span className="font-mono text-emerald-400 font-bold">{d.amount}</span>
              </div>
              <p className="text-xs text-zinc-300 font-bold">{d.issue}</p>
              <p className="text-[11px] text-zinc-400">Worker: {d.worker} vs Employer: {d.employer}</p>

              {d.status === "Open" && (
                <button
                  type="button"
                  onClick={() => resolveDispute(d.id)}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
                >
                  Resolve & Release Escrow to Worker
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
