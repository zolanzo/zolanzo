"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Wallet01Icon, ArrowRight01Icon, Clock01Icon } from "@hugeicons/core-free-icons";

interface WalletCardProps {
  availableBalance?: string;
  todayEarnings?: string;
  pendingEarnings?: string;
  onWithdraw?: () => void;
  onHistory?: () => void;
}

export function WalletCard({
  availableBalance = "₦283,600",
  todayEarnings = "₦18,400",
  pendingEarnings = "₦7,250",
  onWithdraw,
  onHistory,
}: WalletCardProps) {
  return (
    <div className="w-full bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/20 relative overflow-hidden space-y-6">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <HugeiconsIcon icon={Wallet01Icon} size={18} />
          </div>
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Wallet Balance</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
          ● Live Status
        </span>
      </div>

      {/* Main Available Balance (Visual Focus) */}
      <div>
        <span className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider mb-1">Available Balance</span>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
            {availableBalance}
          </span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Instant Payout
          </span>
        </div>
      </div>

      {/* Metrics Row: Today & Pending */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Today&apos;s Earnings</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">{todayEarnings}</span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Pending Earnings</span>
          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{pendingEarnings}</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onWithdraw}
          className="flex-1 h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Withdraw</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>

        <button
          type="button"
          onClick={onHistory}
          className="flex-1 h-[48px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-300 font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <HugeiconsIcon icon={Clock01Icon} size={16} />
          <span>History</span>
        </button>
      </div>
    </div>
  );
}
