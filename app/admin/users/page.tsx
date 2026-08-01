"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { AdminShell } from "@/components/admin/admin-shell";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "Earn" | "Hire";
  status: "Active" | "Suspended";
  ninStatus: "Verified" | "Pending";
  walletBalance: string;
  joinedAt: string;
}

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [users, setUsers] = useState<UserItem[]>([
    { id: "u_1", name: "Grace Adebayo", email: "grace.adebayo@example.com", role: "Earn", status: "Active", ninStatus: "Verified", walletBalance: "₦283,600", joinedAt: "Jan 2025" },
    { id: "u_2", name: "Amina Aliyu", email: "amina@kora-ai.example.com", role: "Hire", status: "Active", ninStatus: "Verified", walletBalance: "₦450,000", joinedAt: "Feb 2025" },
    { id: "u_3", name: "Chidi Okonkwo", email: "chidi.o@example.com", role: "Earn", status: "Active", ninStatus: "Verified", walletBalance: "₦142,000", joinedAt: "Mar 2025" },
    { id: "u_4", name: "Suspended Account", email: "spam@example.com", role: "Earn", status: "Suspended", ninStatus: "Pending", walletBalance: "₦0", joinedAt: "Apr 2025" },
  ]);

  const toggleSuspend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u))
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" || u.role === filter || u.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminShell>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Universal Users Directory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/30">
                102,450 Total Accounts
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Audit user accounts, reset PINs, suspend accounts, and inspect wallet balances.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(["All", "Earn", "Hire", "Active", "Suspended"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-4 h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filter === tab
                    ? "bg-red-600/20 border border-red-500 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-[38px] pl-9 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#04090B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Account Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">NIN Verification</th>
                  <th className="p-4">Wallet Balance</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        u.role === "Earn" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300">{u.ninStatus}</td>
                    <td className="p-4 font-mono font-bold text-white">{u.walletBalance}</td>
                    <td className="p-4 text-zinc-400">{u.joinedAt}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSuspend(u.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                          u.status === "Active" ? "bg-red-500/15 border border-red-500/30 text-red-400" : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        {u.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
