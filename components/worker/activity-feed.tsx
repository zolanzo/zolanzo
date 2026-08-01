"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

export function ActivityFeed() {
  const activities = [
    { title: "AI Model Annotation", amount: "+₦850", time: "25 mins ago", status: "Completed" },
    { title: "Mobile Banking Survey", amount: "+₦450", time: "Yesterday", status: "Completed" },
    { title: "Content Proofreading", amount: "+₦1,200", time: "2 days ago", status: "Completed" },
  ];

  return (
    <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Activity</h4>
        <span className="text-[10px] font-semibold text-emerald-400">All Cleared</span>
      </div>

      <div className="space-y-2">
        {activities.map((act, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">{act.title}</p>
                <p className="text-[10px] text-zinc-500">{act.time}</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400">{act.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
