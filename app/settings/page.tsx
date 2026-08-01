"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  Notification01Icon,
  CircleLock01Icon,
  SmartPhone01Icon,
  Building01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

type SettingsTab = "General" | "Notifications" | "Security" | "Devices" | "Bank Account" | "Danger Zone";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("General");
  const [savedMessage, setSavedMessage] = useState("");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage("Settings saved successfully.");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1100px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Settings & Preferences
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Account Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
            Manage your account security, notification preferences, PIN authorization, and bank account settings.
          </p>
        </div>

        {savedMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* Setting Category Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          <div className="space-y-1 bg-[#0A0F12] border border-white/10 rounded-2xl p-2">
            {[
              { id: "General", label: "General & Identity", icon: Settings01Icon },
              { id: "Notifications", label: "Notifications", icon: Notification01Icon },
              { id: "Security", label: "Security & PIN", icon: CircleLock01Icon },
              { id: "Devices", label: "Active Devices", icon: SmartPhone01Icon },
              { id: "Bank Account", label: "Bank Payouts", icon: Building01Icon },
              { id: "Danger Zone", label: "Danger Zone", icon: AlertCircleIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-left ${
                  activeTab === tab.id
                    ? "bg-[#008744]/20 border border-[#008744] text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <HugeiconsIcon icon={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Box */}
          <div className="lg:col-span-3 bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            
            {activeTab === "General" && (
              <form onSubmit={handleSave} className="space-y-5 text-left">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">General Information</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Grace Adebayo"
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Email Address (Verified)</label>
                  <input
                    type="email"
                    disabled
                    defaultValue="grace.adebayo@example.com"
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Primary Currency</label>
                  <input
                    type="text"
                    disabled
                    defaultValue="NGN (Nigerian Naira - ₦)"
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-sm cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  className="h-[44px] px-6 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            )}

            {activeTab === "Notifications" && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Notification Channels</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                    <span className="text-xs font-bold text-white">Email Opportunity Alerts</span>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-[#008744]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                    <span className="text-xs font-bold text-white">SMS Security & OTP Verification</span>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-[#008744]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                    <span className="text-xs font-bold text-white">Wallet Disbursement Notifications</span>
                    <input
                      type="checkbox"
                      checked={payoutAlerts}
                      onChange={(e) => setPayoutAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-[#008744]"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === "Security" && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Security & Authorization PIN</h3>
                
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">6-Digit Transaction PIN</p>
                    <p className="text-[11px] text-zinc-400">Used to authorize bank withdrawals and wallet actions.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("Change PIN flow initiated...")}
                    className="h-[38px] px-4 rounded-xl border border-zinc-800 bg-zinc-800 text-zinc-200 text-xs font-bold hover:text-white"
                  >
                    Change PIN
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Devices" && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Active Authorized Sessions</h3>
                
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={20} className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Safari on macOS (Current Session)</p>
                      <p className="text-[10px] text-emerald-400 font-mono">Lagos, Nigeria • IP: 102.89.x.x</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active Now
                  </span>
                </div>
              </div>
            )}

            {activeTab === "Bank Account" && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Linked Payout Bank Account</h3>
                
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={Building01Icon} size={20} className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Guaranty Trust Bank (GTBank)</p>
                      <p className="text-xs text-zinc-400 font-mono">012****890 • Grace Adebayo</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">Primary Account</span>
                </div>
              </div>
            )}

            {activeTab === "Danger Zone" && (
              <div className="space-y-5 border border-red-500/30 p-6 rounded-2xl bg-red-950/10">
                <h3 className="text-base font-bold text-red-400 uppercase tracking-wider">Danger Zone</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Deleting your ZOLANZO account will permanently forfeit your active balance and close your account.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Contact support to process account deletion...")}
                  className="h-[44px] px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Delete ZOLANZO Account
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </AppShell>
  );
}
