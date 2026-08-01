"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered a temporary network issue. Please retry.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 text-center flex flex-col items-center justify-center space-y-3 my-4">
      <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
        <HugeiconsIcon icon={AlertCircleIcon} size={20} />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-zinc-400">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-[36px] px-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={RefreshIcon} size={14} />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
