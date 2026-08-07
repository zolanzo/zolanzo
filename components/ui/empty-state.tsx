"use client";

import React from "react";
import Link from "next/link";
import { CustomBrandIllustration } from "@/components/brand/custom-brand-illustration";

interface EmptyStateProps {
  type?: "tasks" | "wallet" | "profile" | "referral" | "support" | "success";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  type = "tasks",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-[20px] bg-white border border-slate-200/80 shadow-soft space-y-4 my-3 ${className}`}>
      {/* Brand Custom Illustration */}
      <CustomBrandIllustration type={type} className="w-24 h-24 mb-1" />

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-1"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && !actionHref && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-1"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
