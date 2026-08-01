"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnalyticsUpIcon } from "@hugeicons/core-free-icons";

interface ProgressCardProps {
  goalAmount?: string;
  earnedAmount?: string;
  percentage?: number;
}

export function ProgressCard({
  goalAmount = "₦25,000",
  earnedAmount = "₦18,400",
  percentage = 74,
}: ProgressCardProps) {
  return (
    <div className="w-full bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <HugeiconsIcon icon={AnalyticsUpIcon} size={16} />
          </div>
          <span className="text-xs font-bold text-zinc-300">Daily Earning Goal</span>
        </div>
        <span className="text-xs font-black text-emerald-400">{percentage}% Achieved</span>
      </div>

      <div className="flex items-baseline justify-between text-xs">
        <span className="text-zinc-400">Earned: <strong className="text-white font-bold">{earnedAmount}</strong></span>
        <span className="text-zinc-400">Target: <strong className="text-zinc-200 font-bold">{goalAmount}</strong></span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#008744] via-emerald-400 to-teal-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[11px] text-zinc-400 italic">
        🔥 You&apos;re only ₦6,600 away from crushing your daily earning goal!
      </p>
    </div>
  );
}
