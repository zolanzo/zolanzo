"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function AdminPayoutsPage() {
  const [approvedList, setApprovedList] = useState<string[]>([]);

  const pendingPayouts = [
    { id: "po1", worker: "Kwame Mensah", amount: "$50.00", channel: "MTN Mobile Money (Ghana 🇬🇭)", ref: "KORA_OUT_8812" },
    { id: "po2", worker: "Amina Bello", amount: "$120.00", channel: "GTBank (Nigeria 🇳🇬)", ref: "KORA_OUT_9941" },
  ];

  const handleApprovePayout = (id: string) => {
    setApprovedList((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Admin — Korapay Payout Approvals</h1>
          <p className="text-zinc-400">Audit & authorize outgoing Mobile Money / Bank disbursements</p>
        </div>
        <Link href="/admin/dashboard" className="text-amber-400 font-bold hover:underline">
          Back to Admin Dashboard
        </Link>
      </div>

      <div className="space-y-4">
        {pendingPayouts.map((p) => {
          const isDone = approvedList.includes(p.id);
          return (
            <div key={p.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-zinc-200">{p.worker} — {p.amount}</div>
                <div className="text-[10px] text-zinc-400">Destination: {p.channel} • Ref: {p.ref}</div>
              </div>

              {isDone ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                  Disbursement Authorized via Korapay!
                </span>
              ) : (
                <button
                  onClick={() => handleApprovePayout(p.id)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-all min-h-[44px]"
                >
                  Approve & Disburse {p.amount}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
