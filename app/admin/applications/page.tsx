"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminApplicationsPage() {
  const [submissions, setSubmissions] = useState([
    { id: "sub_1", worker: "Grace Adebayo", title: "AI Model Image Dataset Annotation", reward: "₦850", status: "AwaitingReview", evidence: "Completed 50 bounding boxes" },
    { id: "sub_2", worker: "Chidi Okonkwo", title: "Mobile Banking Usability Survey", reward: "₦1,200", status: "AwaitingReview", evidence: "Submitted iOS transfer test feedback" },
  ]);

  const forceApprove = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Approved" } : s))
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
                Global Applications & Submissions Inspection
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/30">
                Super Admin Override Controls
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Inspect submitted evidence across all campaigns and force approve/reject when necessary.
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
                  <th className="p-4">Opportunity</th>
                  <th className="p-4">Evidence Notes</th>
                  <th className="p-4">Escrow Reward</th>
                  <th className="p-4 text-right">Admin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{s.worker}</td>
                    <td className="p-4 text-zinc-300">{s.title}</td>
                    <td className="p-4 text-zinc-400 font-mono text-[11px]">{s.evidence}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{s.reward}</td>
                    <td className="p-4 text-right">
                      {s.status !== "Approved" && (
                        <button
                          type="button"
                          onClick={() => forceApprove(s.id)}
                          className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Force Approve & Pay
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
