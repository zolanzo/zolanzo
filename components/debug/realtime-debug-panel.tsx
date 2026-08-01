"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { useRealtimeState } from "@/lib/realtime/subscriptions";
import { zolanzoRealtime } from "@/lib/realtime/engine";
import { RealtimeEventType } from "@/lib/realtime/types";

export function RealtimeDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const state = useRealtimeState();
  const history = zolanzoRealtime.getHistory();

  const handleTestEmit = (type: RealtimeEventType) => {
    zolanzoRealtime.publish(type, {
      testTrigger: true,
      message: `Developer test trigger for ${type}`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleToggleOnline = () => {
    zolanzoRealtime.setOnline(!state.isConnected);
  };

  const handleReplayQueue = () => {
    zolanzoRealtime.replayQueue();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-10 px-3.5 rounded-full bg-zinc-900 border border-emerald-500/40 text-emerald-400 font-bold text-xs shadow-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <HugeiconsIcon icon={ZapIcon} size={16} />
          <span>Realtime Debug ({state.eventCount})</span>
        </button>
      ) : (
        <div className="w-[380px] max-h-[540px] bg-[#0A0F12] border border-white/10 rounded-3xl p-5 shadow-2xl text-white space-y-4 flex flex-col relative animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={ZapIcon} size={18} className="text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Realtime Engine Debugger
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

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Status</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    state.isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                  }`}
                />
                <span className={state.isConnected ? "text-emerald-400" : "text-red-400"}>
                  {state.isConnected ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Queue / Events</span>
              <p className="font-bold text-white font-mono">
                {state.queuedCount} Queued • {state.eventCount} Emitted
              </p>
            </div>
          </div>

          {/* Active Channels */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
              Subscribed Channels
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {state.activeChannels.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20"
                >
                  #{c}
                </span>
              ))}
            </div>
          </div>

          {/* Test Triggers */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
              Emit Sample Realtime Event
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleTestEmit("WALLET_UPDATED")}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-emerald-400 transition-colors cursor-pointer text-left truncate"
              >
                + Wallet Update
              </button>
              <button
                type="button"
                onClick={() => handleTestEmit("APPLICATION_CREATED")}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-purple-400 transition-colors cursor-pointer text-left truncate"
              >
                + Application Event
              </button>
              <button
                type="button"
                onClick={() => handleTestEmit("ADMIN_BROADCAST")}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-red-400 transition-colors cursor-pointer text-left truncate"
              >
                + Admin Broadcast
              </button>
              <button
                type="button"
                onClick={() => handleTestEmit("NOTIFICATION_CREATED")}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-amber-400 transition-colors cursor-pointer text-left truncate"
              >
                + Alert Notification
              </button>
            </div>
          </div>

          {/* Control Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleOnline}
              className="flex-1 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
            >
              Toggle {state.isConnected ? "Offline" : "Online"}
            </button>

            <button
              type="button"
              onClick={handleReplayQueue}
              className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Replay Queue ({state.queuedCount})
            </button>
          </div>

          {/* Event Stream Log */}
          <div className="flex-1 min-h-0 space-y-1 text-xs">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
              Live Event History
            </span>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {history.length === 0 ? (
                <p className="text-zinc-500 text-[10px]">No events recorded yet.</p>
              ) : (
                history.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-zinc-300"
                  >
                    <div>
                      <span className="font-bold text-white block">{evt.type}</span>
                      <span className="text-[9px] text-zinc-500">
                        #{evt.channel} • {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {evt.isOptimistic && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[9px] font-bold">
                        OPT
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
