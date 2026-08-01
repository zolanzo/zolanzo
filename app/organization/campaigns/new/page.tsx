"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function NewCampaignPage() {
  const [title, setTitle] = useState("");
  const [rewardPerTask, setRewardPerTask] = useState("1.50");
  const [totalQuantity, setTotalQuantity] = useState("100");
  const [created, setCreated] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreated(true);
  };

  const totalBudget = (parseFloat(rewardPerTask || "0") * parseInt(totalQuantity || "0")).toFixed(2);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-2xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Create New Micro-Task Campaign</h1>
          <p className="text-zinc-400">Lock escrow funds & deploy workers across Africa</p>
        </div>
        <Link href="/organization/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
        {created ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Icons.verified size={24} />
            </div>
            <h3 className="font-bold text-sm">Campaign Live & Escrow Locked!</h3>
            <p className="text-zinc-400">
              Budget of ${totalBudget} has been reserved in Korapay escrow. Workers can now accept tasks.
            </p>
            <Link
              href="/organization/campaigns"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold min-h-[44px]"
            >
              View Active Campaigns
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1 text-zinc-300">Campaign Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Social Media Moderation Campaign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-zinc-300">Reward Per Task ($)</label>
                <input
                  required
                  type="number"
                  step="0.10"
                  value={rewardPerTask}
                  onChange={(e) => setRewardPerTask(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-300">Total Workers / Tasks</label>
                <input
                  required
                  type="number"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-zinc-300">Total Escrow Required</div>
                <div className="text-[10px] text-zinc-400">Includes 5% Korapay platform processing fee</div>
              </div>
              <div className="text-xl font-black text-emerald-400">${(parseFloat(totalBudget) * 1.05).toFixed(2)}</div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-md min-h-[44px]"
            >
              Lock Escrow & Launch Campaign
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
