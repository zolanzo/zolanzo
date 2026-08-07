"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export type TeamRole = "Owner" | "Administrator" | "Finance" | "Campaign Manager" | "Reviewer" | "Viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "Active" | "Pending Invite";
}

export default function TeamManagementPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>("Campaign Manager");

  const [members, setMembers] = useState<TeamMember[]>([
    { id: "tm_1", name: "Campaign Owner", email: "hiretest@zolanzo.com", role: "Owner", status: "Active" },
    { id: "tm_2", name: "Finance Manager", email: "finance@zolanzo.com", role: "Finance", status: "Active" },
  ]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail && inviteEmail.includes("@")) {
      const newMember: TeamMember = {
        id: `tm_${Date.now()}`,
        name: inviteEmail.split("@")[0] || "New Member",
        email: inviteEmail,
        role: selectedRole,
        status: "Pending Invite",
      };
      setMembers((prev) => [...prev, newMember]);
      setInviteEmail("");
      setInviteModalOpen(false);
    }
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      
      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[440px] bg-card border border-border rounded-3xl p-6 space-y-5 shadow-2xl relative text-foreground">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold">Invite Team Member</h3>
              <p className="text-xs text-muted-foreground">Grant permission-based access to your corporate hirer workspace.</p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role & Permissions</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                  className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-xs font-bold focus:outline-none"
                >
                  <option value="Administrator">Administrator (Full Access)</option>
                  <option value="Finance">Finance (Wallet & Escrow)</option>
                  <option value="Campaign Manager">Campaign Manager (Create & Manage)</option>
                  <option value="Reviewer">Reviewer (Review Submissions Only)</option>
                  <option value="Viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                Send Invite Email
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Team & Access Permissions
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {members.length} Active Members
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
              Invite team members, assign role-based access control, and audit workspace operations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* Members List */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Member Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-foreground">{m.name}</td>
                    <td className="p-4 text-muted-foreground font-mono">{m.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {m.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === "Active" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {m.role !== "Owner" && (
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
