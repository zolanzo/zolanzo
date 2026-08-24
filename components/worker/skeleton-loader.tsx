"use client";

import React from "react";

export function SkeletonLoader() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-[220px] rounded-3xl bg-muted border border-border" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted border border-border" />
        ))}
      </div>
      <div className="h-[300px] rounded-3xl bg-muted border border-border" />
    </div>
  );
}
