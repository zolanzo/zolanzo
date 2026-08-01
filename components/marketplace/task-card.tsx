"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CheckmarkBadge01Icon,
  StarIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { type MarketplaceTask } from "@/lib/marketplace/mock-tasks";
import { BookmarkButton } from "@/components/marketplace/bookmark-button";

interface TaskCardProps {
  task: MarketplaceTask;
  onPreview: (task: MarketplaceTask) => void;
}

export function TaskCard({ task, onPreview }: TaskCardProps) {
  const slotColor =
    task.slotStatus === "Few Slots Left" || task.slotStatus === "Almost Full"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : task.slotStatus === "Premium"
      ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

  return (
    <div
      onClick={() => onPreview(task)}
      className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 hover:border-zinc-700 hover:-translate-y-[2px] transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer shadow-sm relative group"
    >
      {/* Header Badges & Bookmark */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold">
              {task.category}
            </span>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${slotColor}`}>
              {task.availableSlots} Slots Left
            </span>
          </div>

          <BookmarkButton taskId={task.id} />
        </div>

        {/* Employer & Verified Rating */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="font-bold text-zinc-200">{task.employerName}</span>
            {task.employerVerified && (
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-emerald-400" />
            )}
          </div>
          <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
            <HugeiconsIcon icon={StarIcon} size={12} className="fill-amber-400" />
            <span>★★★★★ Verified</span>
          </div>
        </div>

        {/* Opportunity Title */}
        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
          {task.title}
        </h3>

        {/* Intelligence Badge */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
            🔥 94% Approval Rate
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {task.shortDescription}
        </p>
      </div>

      {/* Meta Specs */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/5">
        <div className="flex items-center gap-1 font-semibold text-zinc-300">
          <HugeiconsIcon icon={Clock01Icon} size={14} />
          <span>{task.estimatedTime} • {task.difficulty}</span>
        </div>

        <div className="flex items-center gap-1 text-zinc-400 font-medium">
          <HugeiconsIcon icon={Location01Icon} size={14} />
          <span>{task.location}</span>
        </div>
      </div>

      {/* Footer: Dominated Reward Payout */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider">Payout</span>
          <span className="text-2xl font-black text-[#008744] tracking-tight">{task.reward}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/tasks/${task.id}`}
            onClick={(e) => e.stopPropagation()}
            className="h-[38px] px-3.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-bold transition-all flex items-center justify-center"
          >
            Details
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(task);
            }}
            className="h-[38px] px-4 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span>Apply →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
