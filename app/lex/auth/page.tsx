"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldKeyIcon,
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

interface StaffTarget {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

const SAMPLE_STAFF_TARGETS: StaffTarget[] = [];

export default function SuperAdminAuthPage() {
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
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 font-sans text-xs text-foreground sm:px-0">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed inset-x-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-floating animate-fadeIn sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md sm:px-5">
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-warning/20 bg-warning/10 px-3 py-2.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-warning">Unavailable</p>
        <p className="text-xs text-muted-foreground mt-0.5">Staff, escrow, and volume figures are not loaded from the database.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary flex items-center justify-center border border-primary/20">
              <HugeiconsIcon icon={ShieldKeyIcon} size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight">
                Super admin
              </h1>
              <p className="text-xs text-muted-foreground">Impersonation and audit log.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-border bg-muted px-3.5 py-2 text-xs font-bold text-muted-foreground">
            Live RBAC required
          </span>
        </div>
      </div>

      {/* SECTION 1: SUPER ADMIN STAFF IMPERSONATION */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={UserCheck01Icon} size={18} className="text-warning" />
              <span>Super Admin Staff Impersonation Control</span>
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              Impersonate staff members to audit support tickets, review moderation decisions, and troubleshoot issues.
            </p>
          </div>

          {activeSession && activeSession.isActive && (
            <button
              type="button"
              onClick={handleExitImpersonation}
              className="cursor-pointer rounded-xl bg-danger px-4 py-2 text-xs font-bold text-danger-foreground transition-colors hover:bg-danger/90"
            >
              Exit Active Impersonation Session
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {SAMPLE_STAFF_TARGETS.length === 0 ? (
            <p className="text-xs text-muted-foreground col-span-full">
              No staff accounts are loaded for impersonation. Staff must come from live RBAC users, not sample names.
            </p>
          ) : null}
          {SAMPLE_STAFF_TARGETS.map((stf) => (
            <div key={stf.id} className="p-4 rounded-xl bg-elevated border border-border space-y-3 flex flex-col justify-between">
              <div>
                <div className="font-bold text-foreground text-xs">{stf.name}</div>
                <div className="text-[11px] text-muted-foreground">{stf.email}</div>
                <div className="text-[10px] text-primary font-semibold mt-1">
                  {stf.role} • {stf.department}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStaff(stf);
                  setShowImpersonateModal(true);
                }}
                className="w-full py-2 rounded-xl bg-warning/15 border border-warning/30 text-warning hover:bg-warning/25 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <HugeiconsIcon icon={ShieldKeyIcon} size={14} />
                <span>Impersonate Staff</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: IMPERSONATION AUDIT LOG TRAIL */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} size={18} className="text-info" />
              <span>Impersonation Audit Log Trail</span>
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              Immutable record of every impersonation session, start/end timestamps, actions, and page views.
            </p>
          </div>
        </div>

        <div className="bg-elevated border border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-card text-muted-foreground font-bold text-[11px]">
                  <th className="p-4">Admin (Initiator)</th>
                  <th className="p-4">Target Staff</th>
                  <th className="p-4">Impersonation Reason</th>
                  <th className="p-4">Timestamps</th>
                  <th className="p-4 text-right">Logged Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-xs text-muted-foreground">
                      No impersonation sessions recorded.
                    </td>
                  </tr>
                ) : null}
                {auditLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="transition-colors hover:bg-hover">
                      <td className="p-4">
                        <div className="font-bold text-foreground text-xs">{log.adminEmail}</div>
                        <div className="text-[10px] text-primary">Super Admin</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-foreground text-xs">{log.targetName}</div>
                        <div className="text-[11px] text-muted-foreground">{log.targetEmail}</div>
                        <div className="text-[10px] text-info">{log.targetRole}</div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="text-xs text-muted-foreground italic">&ldquo;{log.reason}&rdquo;</div>
                      </td>

                      <td className="p-4">
                        <div className="text-[11px] text-muted-foreground">
                          Start: {new Date(log.startTime).toLocaleTimeString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          End: {log.endTime ? new Date(log.endTime).toLocaleTimeString() : "Active Now"}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedLogId(expandedLogId === log.id ? null : log.id)
                          }
                          className="px-3 py-1.5 rounded-lg bg-muted hover:bg-hover text-foreground font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          {expandedLogId === log.id ? "Hide Trail" : `View (${log.actions.length}) Actions`}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Actions Sub-Table */}
                    {expandedLogId === log.id && (
                      <tr className="bg-muted border-b border-border">
                        <td colSpan={5} className="p-4">
                          <div className="space-y-2 max-w-4xl mx-auto">
                            <div className="font-bold text-xs text-warning flex items-center gap-1">
                              <HugeiconsIcon icon={LockKeyIcon} size={14} />
                              <span>Audit Trail for Session #{log.id}</span>
                            </div>
                            <div className="divide-y divide-border bg-card rounded-xl border border-border overflow-hidden">
                              {log.actions.map((act, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-info/10 text-info border border-info/20 rounded">
                                      {act.type}
                                    </span>
                                    <span className="font-mono text-muted-foreground">{act.path}</span>
                                    <span className="text-muted-foreground">- {act.details}</span>
                                  </div>
                                  <span className="text-muted-foreground text-[10px]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-elevated border border-warning/40 rounded-3xl p-6 shadow-2xl space-y-4 relative text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ShieldKeyIcon} size={20} className="text-warning" />
                <h3 className="font-bold text-sm text-foreground">Initiate Staff Impersonation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImpersonateModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <div className="font-bold text-foreground">{selectedStaff.name}</div>
              <div className="text-[11px] text-muted-foreground">{selectedStaff.email}</div>
              <div className="text-[10px] text-primary font-semibold">{selectedStaff.role}</div>
            </div>

            <form onSubmit={handleStartImpersonation} className="space-y-4">
              <div>
                <label className="text-muted-foreground font-bold block mb-1">
                  Reason for Impersonation * (Required for Audit Log)
                </label>
                <textarea
                  rows={3}
                  required
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                  placeholder="e.g. Investigating support ticket escalation SUP-8821..."
                  className="w-full p-3 rounded-xl bg-card border border-border focus:border-warning text-foreground text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-[11px] text-muted-foreground space-y-1">
                <div className="font-bold text-warning flex items-center gap-1">
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
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-hover text-muted-foreground font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground font-black text-xs transition-all cursor-pointer shadow-lg"
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
