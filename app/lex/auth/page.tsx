"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldKeyIcon,
  UserGroupIcon,
  Coins01Icon,
  Analytics01Icon,
  AlertCircleIcon,
  UserCheck01Icon,
  LockKeyIcon,
  Cancel01Icon,
  Tick02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import {
  startImpersonation,
  exitImpersonation,
  getImpersonationSession,
  getAllAuditLogs,
  type ImpersonationAuditLog,
  type ImpersonationSession,
} from "@/lib/auth/impersonation";
import { zolanzoEngine } from "@/lib/engine/business-engine";

interface StaffTarget {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

const SAMPLE_STAFF_TARGETS: StaffTarget[] = [
  {
    id: "stf_1",
    name: "Samuel Kalu",
    email: "samuel.kalu@zolanzo.com",
    role: "Operations Manager",
    department: "Operations",
  },
  {
    id: "stf_2",
    name: "Tunde Bakare",
    email: "tunde.bakare@zolanzo.com",
    role: "Finance Officer",
    department: "Finance",
  },
  {
    id: "stf_3",
    name: "Kemi Adeleke",
    email: "kemi.adeleke@zolanzo.com",
    role: "Support Agent",
    department: "Support",
  },
  {
    id: "stf_4",
    name: "Chidi Okonkwo",
    email: "chidi.okonkwo@zolanzo.com",
    role: "Moderator",
    department: "Moderation",
  },
];

export default function SuperAdminAuthPage() {
  const auditMetrics = zolanzoEngine.getPlatformAuditMetrics();
  const [activeSession, setActiveSession] = useState<ImpersonationSession | null>(getImpersonationSession);
  const [auditLogs, setAuditLogs] = useState<ImpersonationAuditLog[]>(getAllAuditLogs);
  const [selectedStaff, setSelectedStaff] = useState<StaffTarget | null>(null);
  const [impersonateReason, setImpersonateReason] = useState("");
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStartImpersonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !impersonateReason.trim()) {
      alert("Please select a staff member and state a valid reason.");
      return;
    }

    const session = startImpersonation(
      "ops@zolanzo.com",
      selectedStaff.id,
      selectedStaff.name,
      selectedStaff.email,
      selectedStaff.role,
      impersonateReason.trim()
    );

    setActiveSession(session);
    setAuditLogs(getAllAuditLogs());
    setShowImpersonateModal(false);
    setImpersonateReason("");
    triggerToast(`✓ Impersonation active for ${selectedStaff.name}. All actions will be logged.`);
  };

  const handleExitImpersonation = () => {
    exitImpersonation();
    setActiveSession(null);
    setAuditLogs(getAllAuditLogs());
    triggerToast("Impersonation session terminated.");
  };

  return (
    <div className="min-h-screen bg-[#050608] text-white p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-xs font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#008744] text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-400/40 animate-fadeIn">
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <HugeiconsIcon icon={ShieldKeyIcon} size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                Super Admin Control Center
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  /lex/auth
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Platform Moderation, RBAC Governance, Escrow Audit & Impersonation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
            Super Admin Access Granted
          </span>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Platform Volume", val: `₦${auditMetrics.netRevenue.toLocaleString()}`, icon: Coins01Icon, color: "text-emerald-400" },
          { label: "Escrow Reserve", val: `₦${auditMetrics.escrowLocked.toLocaleString()}`, icon: ShieldKeyIcon, color: "text-emerald-400" },
          { label: "Active Earners", val: `${auditMetrics.earnersCount}`, icon: UserGroupIcon, color: "text-blue-400" },
          { label: "Active Hirers", val: `${auditMetrics.hirersCount} Orgs`, icon: Analytics01Icon, color: "text-emerald-400" },
        ].map(({ label, val, icon: IconComp, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span>{label}</span>
              <HugeiconsIcon icon={IconComp} size={18} className={color} />
            </div>
            <div className="text-2xl font-black tracking-tight">{val}</div>
          </div>
        ))}
      </div>

      {/* SECTION 1: SUPER ADMIN STAFF IMPERSONATION */}
      <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HugeiconsIcon icon={UserCheck01Icon} size={18} className="text-amber-400" />
              <span>Super Admin Staff Impersonation Control</span>
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              Impersonate staff members to audit support tickets, review moderation decisions, and troubleshoot issues.
            </p>
          </div>

          {activeSession && activeSession.isActive && (
            <button
              type="button"
              onClick={handleExitImpersonation}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Exit Active Impersonation Session
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {SAMPLE_STAFF_TARGETS.map((stf) => (
            <div key={stf.id} className="p-4 rounded-xl bg-[#131922] border border-white/[0.08] space-y-3 flex flex-col justify-between">
              <div>
                <div className="font-bold text-white text-xs">{stf.name}</div>
                <div className="text-[11px] text-zinc-400">{stf.email}</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                  {stf.role} • {stf.department}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStaff(stf);
                  setShowImpersonateModal(true);
                }}
                className="w-full py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <HugeiconsIcon icon={ShieldKeyIcon} size={14} />
                <span>Impersonate Staff</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: IMPERSONATION AUDIT LOG TRAIL */}
      <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} size={18} className="text-blue-400" />
              <span>Impersonation Audit Log Trail</span>
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              Immutable record of every impersonation session, start/end timestamps, actions, and page views.
            </p>
          </div>
        </div>

        <div className="bg-[#131922] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0D1218] text-zinc-400 font-bold text-[11px]">
                  <th className="p-4">Admin (Initiator)</th>
                  <th className="p-4">Target Staff</th>
                  <th className="p-4">Impersonation Reason</th>
                  <th className="p-4">Timestamps</th>
                  <th className="p-4 text-right">Logged Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {auditLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{log.adminEmail}</div>
                        <div className="text-[10px] text-emerald-400">Super Admin</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{log.targetName}</div>
                        <div className="text-[11px] text-zinc-400">{log.targetEmail}</div>
                        <div className="text-[10px] text-blue-400">{log.targetRole}</div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="text-xs text-zinc-300 italic">&ldquo;{log.reason}&rdquo;</div>
                      </td>

                      <td className="p-4">
                        <div className="text-[11px] text-zinc-300">
                          Start: {new Date(log.startTime).toLocaleTimeString()}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          End: {log.endTime ? new Date(log.endTime).toLocaleTimeString() : "Active Now"}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedLogId(expandedLogId === log.id ? null : log.id)
                          }
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          {expandedLogId === log.id ? "Hide Trail" : `View (${log.actions.length}) Actions`}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Actions Sub-Table */}
                    {expandedLogId === log.id && (
                      <tr className="bg-black/40 border-b border-white/[0.08]">
                        <td colSpan={5} className="p-4">
                          <div className="space-y-2 max-w-4xl mx-auto">
                            <div className="font-bold text-xs text-amber-400 flex items-center gap-1">
                              <HugeiconsIcon icon={LockKeyIcon} size={14} />
                              <span>Audit Trail for Session #{log.id}</span>
                            </div>
                            <div className="divide-y divide-white/[0.06] bg-[#0D1218] rounded-xl border border-white/[0.08] overflow-hidden">
                              {log.actions.map((act, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                                      {act.type}
                                    </span>
                                    <span className="font-mono text-zinc-300">{act.path}</span>
                                    <span className="text-zinc-400">- {act.details}</span>
                                  </div>
                                  <span className="text-zinc-500 text-[10px]">
                                    {new Date(act.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* START IMPERSONATION MODAL */}
      {showImpersonateModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#131922] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 relative text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ShieldKeyIcon} size={20} className="text-amber-400" />
                <h3 className="font-bold text-sm text-white">Initiate Staff Impersonation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImpersonateModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] space-y-1">
              <div className="font-bold text-white">{selectedStaff.name}</div>
              <div className="text-[11px] text-zinc-400">{selectedStaff.email}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">{selectedStaff.role}</div>
            </div>

            <form onSubmit={handleStartImpersonation} className="space-y-4">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">
                  Reason for Impersonation * (Required for Audit Log)
                </label>
                <textarea
                  rows={3}
                  required
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                  placeholder="e.g. Investigating support ticket escalation SUP-8821..."
                  className="w-full p-3 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-amber-400 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-zinc-300 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} />
                  <span>Strict Security Audit Rules</span>
                </div>
                <p>
                  A top banner will remain visible site-wide. Every page view, action, and timestamp will be permanently logged.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImpersonateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition-all cursor-pointer shadow-lg"
                >
                  Start Impersonation Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
