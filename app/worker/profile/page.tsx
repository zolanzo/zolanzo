import React from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function WorkerProfilePage() {

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-4xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Worker Profile & KYC</h1>
          <p className="text-zinc-400">Manage identity verification & Korapay payout accounts</p>
        </div>
        <Link href="/worker/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-lg">
              KM
            </div>
            <div>
              <div className="font-bold text-sm">Kwame Mensah</div>
              <div className="text-zinc-400">kwame@example.com • Ghana 🇬🇭</div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-1">
            <Icons.verified size={14} /> KYC Level 3 Verified
          </span>
        </div>

        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <h3 className="font-bold uppercase tracking-wider text-zinc-400">Saved Payout Destination</h3>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icons.bank size={20} className="text-emerald-400" />
              <div>
                <div className="font-bold">MTN Mobile Money (Ghana)</div>
                <div className="text-[10px] text-zinc-400">Account: 0244123456 • Verified Beneficiary</div>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 font-semibold">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
