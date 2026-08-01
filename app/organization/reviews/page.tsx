"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function OrganizationReviewsPage() {
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const pendingProofs = [
    { id: "p1", worker: "Kwame Mensah (Accra 🇬🇭)", task: "Instagram Moderation", reward: "$4.50", proof: "Moderated 10 post tags, verified hashtag compliance. Proof link: https://instagram.com/p/12345" },
    { id: "p2", worker: "Amina Bello (Lagos 🇳🇬)", task: "TikTok Caption Tagging", reward: "$6.00", proof: "Added captions to 5 promotional videos." },
  ];

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Worker Proof Approvals</h1>
          <p className="text-zinc-400">Review submitted evidence and release Korapay escrow payouts</p>
        </div>
        <Link href="/organization/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-4">
        {pendingProofs.map((p) => {
          const isApproved = approvedIds.includes(p.id);
          return (
            <div key={p.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-200">{p.task}</h3>
                  <div className="text-zinc-400">{p.worker}</div>
                </div>
                <div className="text-lg font-black text-emerald-400">{p.reward}</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300">
                <span className="font-semibold text-zinc-400 block mb-1">Submitted Evidence:</span>
                {p.proof}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {isApproved ? (
                  <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                    <Icons.verified size={16} /> Escrow Payout Released via Korapay!
                  </span>
                ) : (
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-all shadow-md min-h-[44px]"
                  >
                    Approve & Release {p.reward} Escrow
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
