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

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="w-full bg-[#0A0F12] border border-white/10 rounded-2xl p-8 text-center space-y-3 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center">
        <HugeiconsIcon icon={InformationCircleIcon} size={24} />
      </div>

      <div className="space-y-1 max-w-xs">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 h-[38px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
