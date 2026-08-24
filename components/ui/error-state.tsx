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
    <div className="my-4 flex flex-col items-center justify-center space-y-3 rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-danger/20 bg-danger/10 text-danger">
        <HugeiconsIcon icon={AlertCircleIcon} size={20} />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 px-4 text-xs font-bold text-danger transition-colors hover:bg-danger/15"
        >
          <HugeiconsIcon icon={RefreshIcon} size={14} />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
