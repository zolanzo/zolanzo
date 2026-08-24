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
    <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 sm:p-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {task.badge && (
              <span className="rounded-full border border-primary/20 bg-primary-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
                {task.badge}
              </span>
            )}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {task.category}
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified
          </span>
        </div>

        <h4 className="text-sm font-bold leading-snug text-foreground">{task.title}</h4>

        <div className="flex items-center justify-between pt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} size={14} /> {task.estimatedTime}
          </span>
          {task.activeWorkers && (
            <span className="text-[11px] font-semibold text-primary">{task.activeWorkers} Workers Active</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Reward</span>
          <span className="text-lg font-black text-primary">{task.reward}</span>
        </div>

        <button
          type="button"
          onClick={() => onApply?.(task)}
          className="flex h-[36px] cursor-pointer items-center gap-1 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover"
        >
          <span>Apply</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </button>
      </div>
    </div>
  );
}
