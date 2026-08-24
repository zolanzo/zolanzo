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
    <div
      className={`flex flex-col items-center justify-center space-y-2.5 rounded-2xl border border-border bg-card p-5 text-center ${className}`}
    >
      <CustomBrandIllustration type={type} className="h-12 w-12" />
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary-hover"
        >
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && !actionHref && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary-hover"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
