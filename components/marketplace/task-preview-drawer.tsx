"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CheckmarkBadge01Icon,
  StarIcon,
  ArrowRight01Icon,
  Location01Icon,
  CheckmarkCircle01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { type MarketplaceTask } from "@/lib/marketplace/mock-tasks";
import { Drawer } from "@/components/ui/drawer";

interface TaskPreviewDrawerProps {
  task: MarketplaceTask | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (task: MarketplaceTask) => void;
}

export function TaskPreviewDrawer({
  task,
  isOpen,
  onClose,
  onApply,
}: TaskPreviewDrawerProps) {
  if (!task) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Opportunity Preview" side="right">
      <div className="space-y-6 text-left pb-12">
        {/* Category & Verified Badge */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold">
            {task.category}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified Task
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-extrabold text-white leading-snug">{task.title}</h2>

        {/* Dominated Reward Box */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Payout Reward</span>
            <span className="text-3xl font-black text-emerald-400 tracking-tight">{task.reward}</span>
          </div>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
            Escrow Protected
          </span>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Est. Duration</span>
            <div className="flex items-center gap-1 text-white font-bold">
              <HugeiconsIcon icon={Clock01Icon} size={14} className="text-emerald-400" />
              <span>{task.estimatedTime}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Difficulty</span>
            <div className="flex items-center gap-1 text-white font-bold">
              <span>{task.difficulty}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Slots Remaining</span>
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <HugeiconsIcon icon={UserIcon} size={14} />
              <span>{task.availableSlots} / {task.totalSlots} Slots</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Location</span>
            <div className="flex items-center gap-1 text-white font-bold">
              <HugeiconsIcon icon={Location01Icon} size={14} className="text-zinc-400" />
              <span className="truncate">{task.location}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Description</h4>
          <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80">
            {task.shortDescription}
          </p>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Requirements</h4>
          <ul className="space-y-2">
            {task.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-400 shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hirer Info */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{task.employerName}</span>
            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
              <HugeiconsIcon icon={StarIcon} size={14} className="fill-amber-400" />
              <span>{task.employerRating} Hirer Rating</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">
            Verified hirer with 100% escrow funding record on ZOLANZO.
          </p>
        </div>

        {/* Apply CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onApply(task);
            }}
            className="w-full h-[50px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Apply for Opportunity</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </button>
        </div>
      </div>
    </Drawer>
  );
}
