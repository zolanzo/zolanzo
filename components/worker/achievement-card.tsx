"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";

export function AchievementCard() {
  return (
    <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Achievements</h4>
        <span className="text-[10px] font-semibold text-emerald-400">Level 4 Worker</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <span className="text-base block">🔥</span>
          <span className="text-xs font-bold text-white block">5-Day</span>
          <span className="text-[9px] text-zinc-400 block">Streak</span>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} className="text-emerald-400 mx-auto" />
          <span className="text-xs font-bold text-white block">98%</span>
          <span className="text-[9px] text-zinc-400 block">Approval</span>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
          <HugeiconsIcon icon={StarIcon} size={18} className="text-amber-400 mx-auto" />
          <span className="text-xs font-bold text-white block">Top 10%</span>
          <span className="text-[9px] text-zinc-400 block">Earner</span>
        </div>
      </div>
    </div>
  );
}
