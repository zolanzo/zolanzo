"use client";

import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function AuthHeader({ title, subtitle, badge }: AuthHeaderProps) {
  return (
    <div className="text-center mb-6 space-y-2">
      {badge && (
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
          {badge}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-[340px] mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
