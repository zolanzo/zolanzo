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

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "stf_1",
    firstName: "Samuel",
    lastName: "Kalu",
    email: "samuel.kalu@zolanzo.com",
    phone: "+234 803 123 4567",
    department: "Operations",
    role: "Manager",
    manager: "Executive Board",
    status: "Active",
    tempPin: "849201",
    mustChangePinOnLogin: false,
    createdAt: "2025-01-15",
  },
  {
    id: "stf_2",
    firstName: "Tunde",
    lastName: "Bakare",
    email: "tunde.bakare@zolanzo.com",
    phone: "+234 812 987 6543",
    department: "Finance",
    role: "Finance Officer",
    manager: "Samuel Kalu",
    status: "Active",
    tempPin: "212523",
    mustChangePinOnLogin: false,
    createdAt: "2025-02-01",
  },
  {
    id: "stf_3",
    firstName: "Kemi",
    lastName: "Adeleke",
    email: "kemi.adeleke@zolanzo.com",
    phone: "+234 701 555 1212",
    department: "Support",
    role: "Support Agent",
    manager: "Samuel Kalu",
    status: "Active",
    tempPin: "772109",
    mustChangePinOnLogin: true,
    createdAt: "2025-03-10",
  },
  {
    id: "stf_4",
    firstName: "Chidi",
    lastName: "Okonkwo",
    email: "chidi.okonkwo@zolanzo.com",
    phone: "+234 908 444 3322",
    department: "Moderation",
    role: "Moderator",
    manager: "Samuel Kalu",
    status: "Active",
    tempPin: "991042",
    mustChangePinOnLogin: false,
    createdAt: "2025-03-22",
  },
];

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

  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
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
  const [manager, setManager] = useState("Samuel Kalu");
  const [status, setStatus] = useState<EmploymentStatus>("Active");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const generateSecurePin = () => {
    const val = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
    return (100000 + (val % 900000)).toString();
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert("First Name, Last Name, and Email are required.");
      return;
    }

    const tempPin = generateSecurePin();
    const newStaff: StaffMember = {
      id: `stf_${Date.now()}`,
      firstName,
      lastName,
      email,
      phone: phone || "+234 800 000 0000",
      department,
      role,
      manager: manager || "Samuel Kalu",
      status,
      tempPin,
      mustChangePinOnLogin: true,
      createdAt: new Date().toISOString().split("T")[0] ?? "",
    };

    setStaffList([newStaff, ...staffList]);
    setShowCreateModal(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    triggerToast(`✓ Staff user created! Temporary PIN (${tempPin}) emailed to ${email}.`);
  };

  const handleStatusChange = (id: string, newStatus: EmploymentStatus) => {
    setStaffList(
      staffList.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    triggerToast(`Staff account status updated to ${newStatus}.`);
  };

  const handleResetPin = (id: string, name: string) => {
    const newPin = generateSecurePin();
    setStaffList(
      staffList.map((s) =>
        s.id === id ? { ...s, tempPin: newPin, mustChangePinOnLogin: true } : s
      )
    );
    triggerToast(`✓ Temporary PIN reset to (${newPin}) for ${name}.`);
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
    <div className="min-h-screen bg-[#050608] text-white p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-xs font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#008744] text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-400/40 animate-fadeIn">
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <HugeiconsIcon icon={UserGroupIcon} size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                ZOLANZO Internal Staff Management
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  /lex/staff
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Staff Roster, Departmental Operations, Tickets & Audit Control</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={16} />
            <span>Create New Staff</span>
          </button>
          <Link
            href="/lex/auth"
            className="px-3.5 py-2.5 rounded-xl bg-[#0D1218] border border-white/[0.08] hover:border-emerald-500/40 text-zinc-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={ShieldKeyIcon} size={15} className="text-emerald-400" />
            <span>Super Admin</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-white/[0.08] pb-1 select-none">
        {[
          { id: "overview", label: "Overview", icon: Building01Icon },
          { id: "roster", label: `Staff Roster (${staffList.length})`, icon: UserGroupIcon },
          { id: "assigned", label: "Assigned Work", icon: UserCheck01Icon },
          { id: "tickets", label: `Support Tickets (${tickets.length})`, icon: HelpCircleIcon },
          { id: "moderation", label: `Moderation Queue (${moderations.length})`, icon: CheckmarkBadge01Icon },
          { id: "careers", label: "Careers & ATS Pipeline", icon: Briefcase01Icon },
          { id: "notifications", label: "Notifications", icon: Notification01Icon },
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
                  ? "bg-[#008744]/20 border-[#008744] text-white ring-1 ring-[#008744]/40"
                  : "bg-[#0D1218] border-white/[0.08] text-zinc-400 hover:border-emerald-500/40 hover:text-white"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={15} className={isActive ? "text-emerald-400" : "text-zinc-500"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-2">
              <div className="text-zinc-400">Total Staff Members</div>
              <div className="text-3xl font-black text-white">{staffList.length}</div>
              <div className="text-[11px] text-emerald-400 font-semibold">9 Departments Active</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-2">
              <div className="text-zinc-400">Open Support Tickets</div>
              <div className="text-3xl font-black text-amber-400">{tickets.length}</div>
              <div className="text-[11px] text-amber-400/80 font-semibold">Average SLA &lt; 15 mins</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-2">
              <div className="text-zinc-400">Pending Moderation Queue</div>
              <div className="text-3xl font-black text-blue-400">{moderations.length}</div>
              <div className="text-[11px] text-blue-400/80 font-semibold">KYC & Brief Audits</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-2">
              <div className="text-zinc-400">Moderation Quality Score</div>
              <div className="text-3xl font-black text-emerald-400">99.8%</div>
              <div className="text-[11px] text-emerald-400/80 font-semibold">Zero Fraud Escapes</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HugeiconsIcon icon={Building01Icon} size={18} className="text-blue-400" />
              <span>Departmental Headcount & Governance</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DEPARTMENTS.map((dept) => {
                const count = staffList.filter((s) => s.department === dept).length;
                return (
                  <div key={dept} className="p-3.5 rounded-xl bg-[#131922] border border-white/[0.08] flex items-center justify-between">
                    <span className="font-bold text-zinc-300">{dept}</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
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
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, role..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white text-xs focus:outline-none placeholder-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-zinc-400 text-xs font-semibold">Department:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] text-white text-xs focus:outline-none"
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
          <div className="bg-[#0D1218] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#131922] text-zinc-400 font-bold text-[11px]">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department & Role</th>
                    <th className="p-4">Manager</th>
                    <th className="p-4">Employment Status</th>
                    <th className="p-4">Security PIN</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-[11px] text-zinc-400">{s.email}</div>
                        <div className="text-[10px] text-zinc-500">{s.phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-emerald-400">{s.role}</div>
                        <div className="text-[11px] text-zinc-400">{s.department}</div>
                      </td>
                      <td className="p-4 text-zinc-300 font-medium">{s.manager}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            s.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : s.status === "Suspended"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={LockKeyIcon} size={14} className="text-zinc-500" />
                          <span className="font-mono text-zinc-300 font-bold">{s.tempPin}</span>
                        </div>
                        {s.mustChangePinOnLogin && (
                          <span className="text-[9px] text-amber-400 block pt-0.5">Must change on login</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetPin(s.id, `${s.firstName} ${s.lastName}`)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Reset PIN
                          </button>

                          {s.status === "Active" ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Suspended")}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Active")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Activate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.id, "Disabled")}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-[10px] font-bold transition-colors cursor-pointer"
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
          <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HugeiconsIcon icon={UserCheck01Icon} size={18} className="text-emerald-400" />
              <span>Assigned Work Tasks</span>
            </h3>
            <p className="text-zinc-400">Tasks directly assigned to your employee credentials by team leads.</p>
            <div className="pt-2 space-y-2">
              <div className="p-3.5 rounded-xl bg-[#131922] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Verify Korapay Escrow Settlement Log #9910</div>
                  <div className="text-[11px] text-zinc-400">Assigned by Samuel Kalu • Due Today</div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerToast("Work item marked completed.")}
                  className="px-3 py-1.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-colors cursor-pointer"
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
          <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HugeiconsIcon icon={HelpCircleIcon} size={18} className="text-amber-400" />
              <span>Internal Support Desk Tickets</span>
            </h3>

            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-xl bg-[#131922] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-bold">{t.ticketNumber}</span>
                      <span className="font-bold text-white text-xs">{t.subject}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      User: {t.userEmail} ({t.userRole}) • Assigned: {t.assignedTo}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t.priority} Priority
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTickets(tickets.filter((x) => x.id !== t.id));
                        triggerToast(`Ticket ${t.ticketNumber} resolved.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
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
          <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} className="text-blue-400" />
              <span>Platform Content & Campaign Moderation Queue</span>
            </h3>

            <div className="space-y-3">
              {moderations.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-[#131922] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white text-xs">{m.title}</div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Type: {m.type} • By: {m.submittedBy} • Risk Score: <span className="text-emerald-400 font-bold">{m.riskScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModerations(moderations.filter((x) => x.id !== m.id));
                        triggerToast(`✓ ${m.type} approved.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModerations(moderations.filter((x) => x.id !== m.id));
                        triggerToast(`Item rejected and returned for revision.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-xs font-bold transition-colors cursor-pointer"
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
        <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HugeiconsIcon icon={Notification01Icon} size={18} className="text-emerald-400" />
            <span>Staff Internal Broadcast Notifications</span>
          </h3>
          <div className="p-4 rounded-xl bg-[#131922] border border-white/[0.08] space-y-1">
            <div className="font-bold text-white text-xs">System Maintenance Scheduled</div>
            <div className="text-[11px] text-zinc-400">Database index optimization tonight at 02:00 UTC.</div>
          </div>
        </div>
      )}

      {/* TAB 7: CALENDAR */}
      {activeTab === "calendar" && (
        <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HugeiconsIcon icon={Calendar01Icon} size={18} className="text-blue-400" />
            <span>Staff Shift & Compliance Review Calendar</span>
          </h3>
          <div className="p-4 rounded-xl bg-[#131922] border border-white/[0.08]">
            <div className="font-bold text-white text-xs">Shift Schedule: Mon - Fri (09:00 - 17:00 WAT)</div>
            <div className="text-[11px] text-zinc-400 mt-1">Next SLA Compliance Sync: Tomorrow at 10:00 WAT</div>
          </div>
        </div>
      )}

      {/* TAB 8: SETTINGS */}
      {activeTab === "settings" && (
        <div className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HugeiconsIcon icon={ShieldKeyIcon} size={18} className="text-emerald-400" />
            <span>Staff Account Security & PIN Change</span>
          </h3>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="text-zinc-400 font-bold block mb-1">Current Staff PIN</label>
              <input type="password" maxLength={6} placeholder="••••••" className="w-full h-10 px-3 rounded-xl bg-[#131922] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#008744]" />
            </div>
            <div>
              <label className="text-zinc-400 font-bold block mb-1">New 6-Digit PIN</label>
              <input type="password" maxLength={6} placeholder="••••••" className="w-full h-10 px-3 rounded-xl bg-[#131922] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#008744]" />
            </div>
            <button
              type="button"
              onClick={() => triggerToast("✓ Staff Security PIN updated successfully.")}
              className="px-4 py-2.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Update Security PIN
            </button>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-[#131922] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5 relative text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={UserAdd01Icon} size={20} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Create Internal Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Samuel"
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kalu"
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samuel.kalu@zolanzo.com"
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as StaffDepartment)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] text-white text-xs focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Staff Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] text-white text-xs focus:outline-none"
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
                  <label className="text-zinc-400 font-bold block mb-1">Manager</label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="Samuel Kalu"
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Employment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EmploymentStatus)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0D1218] border border-white/[0.08] text-white text-xs focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] text-[11px] text-zinc-400 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
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
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-colors cursor-pointer shadow-lg"
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
