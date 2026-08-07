"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  CircleLock01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function HirerSettingsPage() {
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
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      <div className="max-w-[900px] mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Hirer Workspace Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Hirer Preferences
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
            Configure automated escrow rules, earner notification triggers, and API webhooks.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Automated Escrow Rules */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <HugeiconsIcon icon={CircleLock01Icon} size={16} className="text-emerald-400" />
              Automated Escrow & Review Rules
            </h3>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Auto-approve Submissions After 48 Hours</p>
                <p className="text-[10px] text-muted-foreground">If unreviewed, earner evidence is automatically approved & escrow released.</p>
              </div>
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 text-left pt-2">
              <label className="text-xs font-semibold text-foreground">Low Escrow Balance Alert Threshold (₦)</label>
              <input
                type="number"
                value={escrowThreshold}
                onChange={(e) => setEscrowThreshold(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm font-bold font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Push Notification Preferences */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <HugeiconsIcon icon={Notification01Icon} size={16} className="text-emerald-400" />
              Hirer Alerts & Webhooks
            </h3>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Send Email Digest on New Submissions</p>
                <p className="text-[10px] text-muted-foreground">Receive real-time notifications when earners submit evidence.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 cursor-pointer"
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
              className="h-[48px] px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              Save Hirer Settings
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
