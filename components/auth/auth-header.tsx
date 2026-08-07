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
        <span className="mb-1 inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {badge}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[340px] mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
