"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: typeof FolderIcon;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon: Icon = FolderIcon,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`p-8 sm:p-12 rounded-3xl bg-[#0A0F12] border border-white/10 text-center flex flex-col items-center justify-center space-y-4 shadow-sm my-4 ${className}`}>
      <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shadow-inner">
        <HugeiconsIcon icon={Icon} size={32} />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="h-[42px] px-6 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:-translate-y-[1px]"
        >
          <span>{actionLabel}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="h-[42px] px-6 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:-translate-y-[1px]"
        >
          <span>{actionLabel}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>
      )}
    </div>
  );
}
