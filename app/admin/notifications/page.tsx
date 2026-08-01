"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminBroadcastPage() {
  const [targetGroup, setTargetGroup] = useState("All");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && body) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setTitle("");
        setBody("");
      }, 2000);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-[900px] mx-auto space-y-6 pb-20">
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">System Broadcast Notifications</h1>
          <p className="text-xs text-zinc-400">Broadcast push, email, and in-app alerts to workers, hirers, or all platform users.</p>
        </div>

        <form onSubmit={handleSend} className="bg-[#04090B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Target Audience</label>
            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 text-white text-xs font-bold focus:outline-none"
            >
              <option value="All">All Platform Users (102,450 Users)</option>
              <option value="Earners">Earners Only (92,000 Users)</option>
              <option value="Hirers">Hirers / Employers Only (10,450 Users)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Broadcast Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Platform Scheduled Maintenance Notice"
              className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 text-white text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Notification Body Message</label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter announcement details..."
              className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 text-white text-xs focus:outline-none"
            />
          </div>

          {sent && (
            <p className="text-xs font-bold text-emerald-400 text-center">
              Broadcast notification successfully dispatched to inbox and push gateways!
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="h-[48px] px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <HugeiconsIcon icon={SentIcon} size={16} />
              <span>Send System Broadcast</span>
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
