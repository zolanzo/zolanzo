"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  UserAdd01Icon,
  CheckmarkBadge01Icon,
  HelpCircleIcon,
  ShieldKeyIcon,
  Calendar01Icon,
  Notification01Icon,
  Search01Icon,
  Cancel01Icon,
  Tick02Icon,
  AlertCircleIcon,
  LockKeyIcon,
  UserCheck01Icon,
  Building01Icon,
  Briefcase01Icon,
} from "@hugeicons/core-free-icons";
import { AdminCareersManager } from "@/components/careers/admin-careers-manager";
import type {
  StaffMember,
  StaffDepartment,
  StaffRole,
  EmploymentStatus,
  SupportTicket,
  ModerationItem,
} from "@/lib/staff/types";

const INITIAL_STAFF: StaffMember[] = [];

const DEPARTMENTS: StaffDepartment[] = [
  "Support",
  "Finance",
  "Moderation",
  "Operations",
  "Marketing",
  "Engineering",
  "Growth",
  "Compliance",
  "Customer Success",
];

const ROLES: StaffRole[] = [
  "Support Agent",
  "Moderator",
  "Finance Officer",
  "Developer",
  "Manager",
  "Administrator",
  "Viewer",
];

const INITIAL_TICKETS: SupportTicket[] = [];

const INITIAL_MODERATION: ModerationItem[] = [];

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "roster" | "assigned" | "tickets" | "moderation" | "careers" | "notifications" | "calendar" | "settings"
  >("overview");

  const [staffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [moderations, setModerations] = useState<ModerationItem[]>(INITIAL_MODERATION);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("All");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<StaffDepartment>("Support");
  const [role, setRole] = useState<StaffRole>("Support Agent");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState<EmploymentStatus>("Active");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert("First Name, Last Name, and Email are required.");
      return;
    }

    triggerToast("Staff accounts are not created here. They must exist in live RBAC.");
    return;
  };

  const handleStatusChange = (_id: string, _newStatus: EmploymentStatus) => {
    triggerToast("Status is not saved. Staff records must come from live RBAC.");
  };

  const handleResetPin = (_id: string, _name: string) => {
    triggerToast("PIN reset is not available without live RBAC.");
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      searchQuery === "" ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDeptFilter === "All" || s.department === selectedDeptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 font-sans text-xs text-foreground sm:px-0">
      <div className="rounded-2xl border border-warning/20 bg-warning/10 px-3 py-2.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-warning">Unavailable</p>
        <p className="text-xs text-muted-foreground mt-0.5">Staff roster, tickets, and moderation queues load from live RBAC. None loaded.</p>
      </div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed inset-x-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-floating animate-fadeIn sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md sm:px-5">
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center border border-info/20">
              <HugeiconsIcon icon={UserGroupIcon} size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight">
                Staff
              </h1>
              <p className="text-xs text-muted-foreground">Roster, tickets, and moderation.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={16} />
            <span>Create staff</span>
          </button>
          <Link
            href="/lex/auth"
            className="px-3.5 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={ShieldKeyIcon} size={15} className="text-primary" />
            <span>Super Admin</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-border pb-1 select-none">
        {[
          { id: "overview", label: "Overview", icon: Building01Icon },
          { id: "roster", label: "Workers", icon: UserGroupIcon },
          { id: "assigned", label: "Assigned", icon: UserCheck01Icon },
          { id: "tickets", label: "Tickets", icon: HelpCircleIcon },
          { id: "moderation", label: "Moderation", icon: CheckmarkBadge01Icon },
          { id: "careers", label: "Careers", icon: Briefcase01Icon },
          { id: "notifications", label: "Alerts", icon: Notification01Icon },
          { id: "calendar", label: "Calendar", icon: Calendar01Icon },
          { id: "settings", label: "Settings", icon: ShieldKeyIcon },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`h-10 px-4 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? "border-primary bg-primary/20 text-foreground ring-1 ring-primary/40"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={15} className={isActive ? "text-primary" : "text-muted-foreground"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-card border border-border">
              <div className="text-muted-foreground">Staff</div>
              <div className="text-xl font-black text-foreground mt-1">{staffList.length}</div>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border">
              <div className="text-muted-foreground">Tickets</div>
              <div className="text-xl font-black text-foreground mt-1">{tickets.length}</div>
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border">
              <div className="text-muted-foreground">Moderation</div>
              <div className="text-xl font-black text-foreground mt-1">{moderations.length}</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Building01Icon} size={18} className="text-info" />
              <span>Departments</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DEPARTMENTS.map((dept) => {
                const count = staffList.filter((s) => s.department === dept).length;
                return (
                  <div key={dept} className="p-3.5 rounded-xl bg-elevated border border-border flex items-center justify-between">
                    <span className="font-bold text-muted-foreground">{dept}</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-info/10 text-info border border-info/20 rounded-md">
                      {count} Staff
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF ROSTER */}
      {activeTab === "roster" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, role..."
                className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-muted-foreground text-xs font-semibold">Department:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-elevated text-muted-foreground font-bold text-[11px]">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department & Role</th>
                    <th className="p-4">Manager</th>
                    <th className="p-4">Employment Status</th>
                    <th className="p-4">Security PIN</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStaff.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-hover">
                      <td className="p-4">
                        <div className="font-bold text-foreground text-xs">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{s.email}</div>
                        <div className="text-[10px] text-muted-foreground">{s.phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-primary">{s.role}</div>
                        <div className="text-[11px] text-muted-foreground">{s.department}</div>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">{s.manager}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            s.status === "Active"
                              ? "bg-primary-subtle text-primary border-primary/20"
                              : s.status === "Suspended"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "border-danger/20 bg-danger/10 text-danger"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={LockKeyIcon} size={14} className="text-muted-foreground" />
                          <span className="font-mono text-muted-foreground font-bold">{s.tempPin}</span>
                        </div>
                        {s.mustChangePinOnLogin && (
                          <span className="text-[9px] text-warning block pt-0.5">Must change on login</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetPin(s.id, `${s.firstName} ${s.lastName}`)}
                            className="px-2.5 py-1 rounded-lg bg-muted hover:bg-hover text-foreground text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Reset PIN
                          </button>

                          {s.status === "Active" ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Suspended")}
                              className="px-2.5 py-1 rounded-lg bg-warning/15 border border-warning/30 text-warning hover:bg-warning/25 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Active")}
                              className="px-2.5 py-1 rounded-lg bg-primary-subtle border border-primary/30 text-primary hover:bg-primary-subtle text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Activate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.id, "Disabled")}
                            className="cursor-pointer rounded-lg border border-danger/30 bg-danger/20 px-2.5 py-1 text-[10px] font-bold text-danger transition-colors hover:bg-danger/30"
                          >
                            Disable
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED WORK */}
      {activeTab === "assigned" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={UserCheck01Icon} size={18} className="text-primary" />
              <span>Assigned Work Tasks</span>
            </h3>
            <p className="text-muted-foreground">Tasks directly assigned to your employee credentials by team leads.</p>
            <div className="pt-2 space-y-2">
              <div className="p-3.5 rounded-xl bg-elevated border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground text-xs">Verify Korapay Escrow Settlement Log #9910</div>
                  <div className="text-[11px] text-muted-foreground">Unassigned</div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerToast("Work item marked completed.")}
                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT TICKETS */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={HelpCircleIcon} size={18} className="text-warning" />
              <span>Internal Support Desk Tickets</span>
            </h3>

            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-xl bg-elevated border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-warning font-bold">{t.ticketNumber}</span>
                      <span className="font-bold text-foreground text-xs">{t.subject}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      User: {t.userEmail} ({t.userRole}) • Assigned: {t.assignedTo}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">
                      {t.priority} Priority
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTickets(tickets.filter((x) => x.id !== t.id));
                        triggerToast(`Ticket ${t.ticketNumber} resolved.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary-subtle border border-primary/30 text-primary hover:bg-primary-subtle text-xs font-bold transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MODERATION QUEUE */}
      {activeTab === "moderation" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} className="text-info" />
              <span>Platform Content & Campaign Moderation Queue</span>
            </h3>

            <div className="space-y-3">
              {moderations.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-elevated border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-foreground text-xs">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Type: {m.type} • By: {m.submittedBy} • Risk Score: <span className="text-primary font-bold">{m.riskScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModerations(moderations.filter((x) => x.id !== m.id));
                        triggerToast(`✓ ${m.type} approved.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModerations(moderations.filter((x) => x.id !== m.id));
                        triggerToast(`Item rejected and returned for revision.`);
                      }}
                      className="cursor-pointer rounded-xl border border-danger/30 bg-danger/20 px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/30"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CAREERS & ATS */}
      {activeTab === "careers" && <AdminCareersManager />}

      {/* TAB 6: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Notification01Icon} size={18} className="text-primary" />
            <span>Staff Internal Broadcast Notifications</span>
          </h3>
          <div className="p-4 rounded-xl bg-elevated border border-border space-y-1">
            <div className="font-bold text-foreground text-xs">System Maintenance Scheduled</div>
            <div className="text-[11px] text-muted-foreground">Database index optimization tonight at 02:00 UTC.</div>
          </div>
        </div>
      )}

      {/* TAB 7: CALENDAR */}
      {activeTab === "calendar" && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Calendar01Icon} size={18} className="text-info" />
            <span>Staff Shift & Compliance Review Calendar</span>
          </h3>
          <div className="p-4 rounded-xl bg-elevated border border-border">
            <div className="font-bold text-foreground text-xs">Shift Schedule: Mon - Fri (09:00 - 17:00 WAT)</div>
            <div className="text-[11px] text-muted-foreground mt-1">Next SLA Compliance Sync: Tomorrow at 10:00 WAT</div>
          </div>
        </div>
      )}

      {/* TAB 8: SETTINGS */}
      {activeTab === "settings" && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={ShieldKeyIcon} size={18} className="text-primary" />
            <span>Staff Account Security & PIN Change</span>
          </h3>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="text-muted-foreground font-bold block mb-1">Current Staff PIN</label>
              <input type="password" maxLength={6} placeholder="••••••" className="w-full h-10 px-3 rounded-xl bg-elevated border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-muted-foreground font-bold block mb-1">New 6-Digit PIN</label>
              <input type="password" maxLength={6} placeholder="••••••" className="w-full h-10 px-3 rounded-xl bg-elevated border border-border text-foreground text-xs focus:outline-none focus:border-primary" />
            </div>
            <button
              type="button"
              onClick={() => triggerToast("✓ Staff Security PIN updated successfully.")}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-all cursor-pointer"
            >
              Update Security PIN
            </button>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-elevated border border-border rounded-3xl p-6 shadow-2xl space-y-5 relative text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={UserAdd01Icon} size={20} className="text-primary" />
                <h3 className="font-bold text-sm text-foreground">Create Internal Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Samuel"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kalu"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samuel.kalu@zolanzo.com"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as StaffDepartment)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Staff Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Manager</label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="Manager name"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Employment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EmploymentStatus)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border text-[11px] text-muted-foreground space-y-1">
                <div className="font-bold text-warning flex items-center gap-1.5">
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} />
                  <span>Security & Credentials Notice</span>
                </div>
                <p>
                  A temporary 6-digit PIN will be auto-generated and emailed directly to the staff member. They will be forced to update their security PIN on first login.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-hover text-muted-foreground font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-colors cursor-pointer shadow-lg"
                >
                  Create & Email PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
