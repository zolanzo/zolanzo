"use client";

import React, { use } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  ClipboardListIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { MOCK_TASKS, type MarketplaceTask } from "@/lib/marketplace/mock-tasks";

interface SubmittedPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkSubmittedPage({ params }: SubmittedPageProps) {
  const resolvedParams = use(params);
  const task: MarketplaceTask = MOCK_TASKS.find((t) => t.id === resolvedParams.id) || MOCK_TASKS[0]!;

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-[600px] mx-auto text-center space-y-6 py-8">
        
        {/* Animated Checkmark Icon */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-950/40">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={48} className="text-emerald-400 animate-pulse" />
        </div>

        {/* Title & Copy */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            Work Submitted Successfully
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Awaiting Hirer Review
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Your submission for <strong className="text-white">{task.title}</strong> has been logged in escrow.
          </p>
        </div>

        {/* Timeline Notice Card */}
        <div className="p-5 rounded-2xl bg-[#0A0F12] border border-white/10 text-left space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated Review Time</span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={14} /> 6–24 Hours
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Escrow Reward Payout:</span>
            <span className="text-emerald-400 font-extrabold text-base">{task.reward}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/tasks"
            className="w-full sm:flex-1 h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>Continue Browsing</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>

          <Link
            href="/applications"
            className="w-full sm:flex-1 h-[48px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={ClipboardListIcon} size={16} />
            <span>View Applications</span>
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
