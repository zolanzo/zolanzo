"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, CheckmarkBadge01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  reward: string;
  estimatedTime: string;
  activeWorkers?: number;
  badge?: string;
}

interface TaskPreviewCardProps {
  task: TaskItem;
  onApply?: (task: TaskItem) => void;
}

export function TaskPreviewCard({ task, onApply }: TaskPreviewCardProps) {
  return (
    <div className="bg-[#0A0F12] rounded-2xl border border-white/10 p-4 sm:p-5 hover:border-zinc-700 hover:-translate-y-[2px] transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {task.badge && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {task.badge}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 text-[10px] font-semibold">
              {task.category}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified
          </span>
        </div>

        <h4 className="text-sm font-bold text-white leading-snug">{task.title}</h4>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} size={14} /> {task.estimatedTime}
          </span>
          {task.activeWorkers && (
            <span className="text-emerald-400 font-semibold text-[11px]">
              {task.activeWorkers} Workers Active
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-zinc-500 font-medium block uppercase tracking-wider">Reward</span>
          <span className="text-lg font-black text-[#008744]">{task.reward}</span>
        </div>

        <button
          type="button"
          onClick={() => onApply?.(task)}
          className="h-[36px] px-3.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
        >
          <span>Apply</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </button>
      </div>
    </div>
  );
}
