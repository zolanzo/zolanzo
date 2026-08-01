"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  CircleLock01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function HireSettingsPage() {
  const [autoApprove, setAutoApprove] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [escrowThreshold, setEscrowThreshold] = useState("50000");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell userName="Amina" avatarUrl="/brand/lady1.png">
      <div className="max-w-[900px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hire Workspace Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
              Employer Preferences
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
            Configure automated escrow rules, applicant notification triggers, and API webhooks.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Automated Escrow Rules */}
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HugeiconsIcon icon={CircleLock01Icon} size={16} className="text-purple-400" />
              Automated Escrow & Review Rules
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Auto-approve Submissions After 48 Hours</p>
                <p className="text-[10px] text-zinc-400">If unreviewed, worker evidence is automatically approved & escrow released.</p>
              </div>
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 text-left pt-2">
              <label className="text-xs font-semibold text-zinc-300">Low Escrow Balance Alert Threshold (₦)</label>
              <input
                type="number"
                value={escrowThreshold}
                onChange={(e) => setEscrowThreshold(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-sm font-bold font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Push Notification Preferences */}
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HugeiconsIcon icon={Notification01Icon} size={16} className="text-purple-400" />
              Employer Alerts & Webhooks
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Send Email Digest on New Submissions</p>
                <p className="text-[10px] text-zinc-400">Receive real-time notifications when workers submit evidence.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {saved && (
            <p className="text-xs font-bold text-emerald-400 text-center flex items-center justify-center gap-1.5">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>Workspace preferences saved successfully!</span>
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="h-[48px] px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              Save Employer Settings
            </button>
          </div>

        </form>

      </div>
    </AppShell>
  );
}
