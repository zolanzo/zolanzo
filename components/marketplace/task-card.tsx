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
      ? "border-warning/20 bg-warning/10 text-warning"
      : task.slotStatus === "Premium"
        ? "border-accent/20 bg-accent-subtle text-accent"
        : "border-primary/20 bg-primary-subtle text-primary";

  return (
    <div
      onClick={() => onPreview(task)}
      className="group relative flex cursor-pointer flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40"
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {task.category}
            </span>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${slotColor}`}>
              {task.availableSlots} Slots Left
            </span>
          </div>

          <BookmarkButton taskId={task.id} />
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate font-bold text-foreground">{task.employerName}</span>
            {task.employerVerified && (
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary" />
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-warning">
            <HugeiconsIcon icon={StarIcon} size={12} className="fill-warning" />
            <span>★★★★★ Verified</span>
          </div>
        </div>

        <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {task.title}
        </h3>

        <div className="flex items-center gap-2 pt-0.5">
          <span className="rounded-md border border-primary/20 bg-primary-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
            🔥 94% Approval Rate
          </span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.shortDescription}</p>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 font-semibold text-foreground">
          <HugeiconsIcon icon={Clock01Icon} size={14} />
          <span>
            {task.estimatedTime} • {task.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-1 font-medium text-muted-foreground">
          <HugeiconsIcon icon={Location01Icon} size={14} />
          <span>{task.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payout</span>
          <span className="text-2xl font-black tracking-tight text-primary">{task.reward}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/tasks/${task.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-3.5 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:bg-hover"
          >
            Details
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(task);
            }}
            className="flex min-h-11 cursor-pointer items-center gap-1 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover"
          >
            <span>Apply →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
