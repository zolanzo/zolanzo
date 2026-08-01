import React from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function WorkerWalletPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Worker Wallet & Earnings</h1>
          <p className="text-zinc-400">Manage earnings, escrow protection, and local payouts</p>
        </div>
        <Link href="/worker/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs opacity-90">
          <span className="font-semibold flex items-center gap-1.5"><Icons.wallet size={16} /> Available Earnings</span>
          <span className="font-mono">Korapay Payout Adapter</span>
        </div>
        <div className="text-3xl font-black">$342.50</div>
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/worker/withdrawals"
            className="px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-bold shadow-md hover:bg-zinc-100 min-h-[44px] flex items-center justify-center gap-1.5"
          >
            <Icons.withdrawal size={16} /> Withdraw to Mobile Money / Bank
          </Link>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Transaction History</h3>
        {[
          { type: "Payout Released", title: "Instagram Moderation", amt: "+$4.50", date: "Today" },
          { type: "Bank Withdrawal", title: "MTN Mobile Money (Ghana)", amt: "-$50.00", date: "July 29" },
        ].map((t) => (
          <div key={t.title} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 text-xs">
            <div>
              <div className="font-bold">{t.title}</div>
              <div className="text-[10px] text-zinc-400">{t.type} • {t.date}</div>
            </div>
            <div className="font-extrabold text-emerald-400">{t.amt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
