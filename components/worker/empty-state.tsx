"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-3 rounded-2xl border border-border bg-card p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
        <HugeiconsIcon icon={InformationCircleIcon} size={24} />
      </div>

      <div className="max-w-xs space-y-1">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 h-[38px] cursor-pointer rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition-all hover:bg-primary-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
