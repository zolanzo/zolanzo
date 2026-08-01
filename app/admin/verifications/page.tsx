"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState([
    { id: "v_1", user: "Grace Adebayo", type: "NIN Slip Verification", nin: "12345678901", status: "Pending" },
  ]);

  const approveVerification = (id: string) => {
    setVerifications((prev) => prev.map((v) => (v.id === id ? { ...v, status: "Verified" } : v)));
  };

  return (
    <AdminShell>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Identity & NIN Verification Queue</h1>
          <p className="text-xs text-zinc-400">Review submitted NIN numbers and government identity documents.</p>
        </div>

        <div className="space-y-3">
          {verifications.map((v) => (
            <div key={v.id} className="p-4 rounded-2xl bg-[#04090B] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{v.user} ({v.type})</p>
                <p className="text-[10px] text-zinc-400 font-mono">NIN: {v.nin} • Status: {v.status}</p>
              </div>

              {v.status === "Pending" && (
                <button
                  type="button"
                  onClick={() => approveVerification(v.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                >
                  Approve NIMC Verification
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
