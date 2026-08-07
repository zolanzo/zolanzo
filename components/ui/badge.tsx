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
    primary: "bg-primary/10 text-primary border-primary/30",
    secondary: "bg-muted text-muted-foreground border-border",
    success: "bg-success/10 text-success border-success/25",
    warning: "bg-warning/10 text-warning border-warning/25",
    danger: "bg-danger/10 text-danger border-danger/25",
    outline: "bg-transparent text-foreground border-border",
    info: "bg-info/10 text-info border-info/25",
    verified: "bg-success/10 text-success border-success/25",
    new: "bg-info/10 text-info border-info/25",
    live: "bg-success/10 text-success border-success/25 animate-pulse",
    pending: "bg-warning/10 text-warning border-warning/25",
    completed: "bg-success/10 text-success border-success/25",
    rejected: "bg-danger/10 text-danger border-danger/25",
    premium: "bg-accent/15 text-accent border-accent/30",
    ai: "bg-info/10 text-info border-info/25",
    quick: "bg-primary/10 text-primary border-primary/25",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
