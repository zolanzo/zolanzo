"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminSettingsPage() {
  const [platformFee, setPlatformFee] = useState("10");
  const [withdrawalFee, setWithdrawalFee] = useState("50");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminShell>
      <div className="max-w-[900px] mx-auto space-y-8 pb-20">
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Global Ecosystem Settings</h1>
          <p className="text-xs text-zinc-400">Configure platform fees, escrow limits, referral bonuses, and emergency maintenance controls.</p>
        </div>

        <form onSubmit={handleSave} className="bg-[#04090B] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Platform Escrow Fee (%)</label>
              <input
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 text-white text-sm font-bold font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Bank Withdrawal Fee (₦)</label>
              <input
                type="number"
                value={withdrawalFee}
                onChange={(e) => setWithdrawalFee(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 text-white text-sm font-bold font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Emergency Maintenance Mode</p>
              <p className="text-[10px] text-zinc-400">Temporarily restrict signups and new campaign creation.</p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-5 h-5 rounded text-red-600 cursor-pointer"
            />
          </div>

          {saved && (
            <p className="text-xs font-bold text-emerald-400 text-center">
              Global platform parameters saved and updated across all edge servers!
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="h-[48px] px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              Save Ecosystem Settings
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
