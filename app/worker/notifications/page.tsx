import React from "react";
import Link from "next/link";

export default function WorkerNotificationsPage() {
  const notifications = [
    { title: "Payout Released", desc: "Korapay released $4.50 to your Mobile Money wallet for Instagram Moderation.", time: "10 mins ago" },
    { title: "Task Verification Approved", desc: "Your proof for AI Image Dataset Tagging has been approved.", time: "2 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-4xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Worker Notifications</h1>
          <p className="text-zinc-400">System, escrow, and payout notifications</p>
        </div>
        <Link href="/worker/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.title} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between font-bold text-zinc-200">
              <span>{n.title}</span>
              <span className="text-[10px] text-zinc-400">{n.time}</span>
            </div>
            <p className="text-zinc-400">{n.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
