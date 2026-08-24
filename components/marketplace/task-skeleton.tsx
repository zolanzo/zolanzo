"use client";

import React from "react";

export function TaskSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[260px] rounded-2xl bg-card border border-border p-5 space-y-4"
        >
          <div className="flex justify-between">
            <div className="h-5 w-24 rounded-full bg-muted" />
            <div className="h-8 w-8 rounded-xl bg-muted" />
          </div>
          <div className="h-6 w-3/4 rounded-lg bg-muted" />
          <div className="h-10 w-full rounded-lg bg-muted/60" />
          <div className="flex justify-between items-center pt-4">
            <div className="h-8 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-24 rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
