"use client";

import React from "react";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "info"
  | "verified"
  | "new"
  | "live"
  | "pending"
  | "completed"
  | "rejected"
  | "premium"
  | "ai"
  | "quick";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "live", children, className = "" }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border leading-tight select-none";

  const variantStyles: Record<BadgeVariant, string> = {
    primary: "bg-[#008744]/15 text-emerald-400 border-[#008744]/30",
    secondary: "bg-zinc-800 text-zinc-300 border-zinc-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    outline: "bg-transparent text-zinc-300 border-zinc-700",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    premium: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    ai: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    quick: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
