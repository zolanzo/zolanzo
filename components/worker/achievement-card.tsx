"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";

export function AchievementCard() {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Achievements</h4>
        <span className="text-[10px] font-semibold text-primary">Level 4 Worker</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-1 rounded-xl border border-border bg-muted p-2.5">
          <span className="block text-base">🔥</span>
          <span className="block text-xs font-bold text-foreground">5-Day</span>
          <span className="block text-[9px] text-muted-foreground">Streak</span>
        </div>

        <div className="space-y-1 rounded-xl border border-border bg-muted p-2.5">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} className="mx-auto text-primary" />
          <span className="block text-xs font-bold text-foreground">98%</span>
          <span className="block text-[9px] text-muted-foreground">Approval</span>
        </div>

        <div className="space-y-1 rounded-xl border border-border bg-muted p-2.5">
          <HugeiconsIcon icon={StarIcon} size={18} className="mx-auto text-warning" />
          <span className="block text-xs font-bold text-foreground">Top 10%</span>
          <span className="block text-[9px] text-muted-foreground">Earner</span>
        </div>
      </div>
    </div>
  );
}
