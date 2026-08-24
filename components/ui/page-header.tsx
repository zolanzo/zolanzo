"use client";

import React from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  description,
  badge,
  action,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  const subText = subtitle || description;
  const actionNode = action || actions;

  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
      <div className="space-y-1">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {badge && (
            <span className="rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {badge}
            </span>
          )}
        </div>
        {subText && <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{subText}</p>}
      </div>

      {actionNode && <div className="shrink-0">{actionNode}</div>}
    </div>
  );
}
