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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
      <div className="space-y-1">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              {badge}
            </span>
          )}
        </div>
        {subText && <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{subText}</p>}
      </div>

      {actionNode && <div className="shrink-0">{actionNode}</div>}
    </div>
  );
}
