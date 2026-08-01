"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ActivityIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { zolanzoCache } from "@/lib/cache/cache-manager";
import { useRealtimeState } from "@/lib/realtime/subscriptions";

export function PerformanceDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState(60);
  const [cacheMetrics, setCacheMetrics] = useState(() => zolanzoCache.getMetrics());
  const realtimeState = useRealtimeState();

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = () => {
      frameCount += 1;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        setCacheMetrics(zolanzoCache.getMetrics());
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-10 px-3.5 rounded-full bg-zinc-900 border border-purple-500/40 text-purple-400 font-bold text-xs shadow-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
          <HugeiconsIcon icon={ActivityIcon} size={16} />
          <span>Perf ({fps} FPS)</span>
        </button>
      ) : (
        <div className="w-[360px] bg-[#0A0F12] border border-white/10 rounded-3xl p-5 shadow-2xl text-white space-y-4 relative animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={ActivityIcon} size={18} className="text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Performance Dashboard
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Frames Per Sec</span>
              <p className="font-black text-xl text-emerald-400 font-mono">{fps} FPS</p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Cache Hit Ratio</span>
              <p className="font-black text-xl text-purple-400 font-mono">{cacheMetrics.hitRatio}%</p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Cache Entries</span>
              <p className="font-bold text-white font-mono">{cacheMetrics.size} Items</p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Realtime Throughput</span>
              <p className="font-bold text-white font-mono">{realtimeState.eventCount} Events</p>
            </div>
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={() => {
              zolanzoCache.clear();
              setCacheMetrics(zolanzoCache.getMetrics());
            }}
            className="w-full h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
          >
            Clear Client Cache
          </button>
        </div>
      )}
    </div>
  );
}
