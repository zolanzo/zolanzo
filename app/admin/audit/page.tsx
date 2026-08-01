"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { activityService } from "@/lib/activity/service";

export default function AdminAuditPage() {
  const [logs] = useState(() => activityService.getActivities());

  return (
    <AdminShell>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Immutable System Audit Logs</h1>
          <p className="text-xs text-zinc-400">Complete audit trail of all platform logins, escrow locks, payouts, and settings changes.</p>
        </div>

        <div className="bg-[#04090B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Event ID</th>
                  <th className="p-4">Event Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Audit Detail</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4 font-mono text-zinc-500">{l.id}</td>
                    <td className="p-4 font-bold text-white">{l.title}</td>
                    <td className="p-4 text-purple-400 font-bold">{l.category}</td>
                    <td className="p-4 text-zinc-300 font-mono text-[11px]">{l.detail}</td>
                    <td className="p-4 text-zinc-400">{l.timestamp}</td>
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
