"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { securityAudit } from "@/lib/security/audit";
import { disasterRecovery } from "@/lib/security/disaster-recovery";

export function SecurityDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs] = useState(() => securityAudit.getLogs());
  const [config, setConfig] = useState(() => disasterRecovery.getConfig());

  const toggleMaintenance = () => {
    const next = !config.maintenanceMode;
    disasterRecovery.setMaintenanceMode(next);
    setConfig(disasterRecovery.getConfig());
  };

  const toggleReadOnly = () => {
    const next = !config.readOnlyMode;
    disasterRecovery.setReadOnlyMode(next);
    setConfig(disasterRecovery.getConfig());
  };

  return (
    <div className="fixed bottom-4 right-44 z-50 font-sans">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-10 px-3.5 rounded-full bg-zinc-900 border border-red-500/40 text-red-400 font-bold text-xs shadow-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
          <HugeiconsIcon icon={Shield01Icon} size={16} />
          <span>Security Audit</span>
        </button>
      ) : (
        <div className="w-[380px] max-h-[540px] bg-[#0A0F12] border border-white/10 rounded-3xl p-5 shadow-2xl text-white space-y-4 flex flex-col relative animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Shield01Icon} size={18} className="text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Developer Security Dashboard
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

          {/* Security Status Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">RBAC Enforcement</span>
              <span className="font-bold text-emerald-400 block">Strict Server-Side</span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">CSRF & Cookies</span>
              <span className="font-bold text-emerald-400 block">SameSite=Strict</span>
            </div>
          </div>

          {/* Disaster Controls */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
              Emergency System Controls
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMaintenance}
                className={`flex-1 h-9 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                  config.maintenanceMode
                    ? "bg-red-600 text-white border-red-500"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                }`}
              >
                Maintenance: {config.maintenanceMode ? "ON" : "OFF"}
              </button>

              <button
                type="button"
                onClick={toggleReadOnly}
                className={`flex-1 h-9 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                  config.readOnlyMode
                    ? "bg-amber-600 text-white border-amber-500"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                }`}
              >
                Read-Only: {config.readOnlyMode ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Live Audit Log */}
          <div className="flex-1 min-h-0 space-y-1 text-xs">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
              Security Audit Event Stream
            </span>
            <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-center">
                  All endpoints secure. No attack anomalies.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-zinc-300"
                  >
                    <div>
                      <span className="font-bold text-white block">{log.type}</span>
                      <span className="text-[9px] text-zinc-500">{log.detail}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        log.status === "BLOCKED" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {log.status}
                    </span>
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
