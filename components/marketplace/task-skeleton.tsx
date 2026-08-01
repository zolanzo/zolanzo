"use client";

import React from "react";

export function TaskSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[260px] rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4"
        >
          <div className="flex justify-between">
            <div className="h-5 bg-zinc-800 rounded-full w-24" />
            <div className="h-8 bg-zinc-800 rounded-xl w-8" />
          </div>
          <div className="h-6 bg-zinc-800 rounded-lg w-3/4" />
          <div className="h-10 bg-zinc-800/60 rounded-lg w-full" />
          <div className="flex justify-between items-center pt-4">
            <div className="h-8 bg-zinc-800 rounded-lg w-24" />
            <div className="h-9 bg-zinc-800 rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
