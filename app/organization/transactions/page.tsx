import React from "react";
import Link from "next/link";

export default function OrganizationTransactionsPage() {
  const transactions = [
    { type: "Escrow Deposit", ref: "KORA_991823", amt: "+$500.00", status: "Completed", date: "Today" },
    { type: "Escrow Release", ref: "KORA_884120", amt: "-$4.50", status: "Completed", date: "Today" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Escrow Ledger & Transactions</h1>
          <p className="text-zinc-400">Audited transaction log for Korapay deposits & escrow releases</p>
        </div>
        <Link href="/organization/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-3">
        {transactions.map((t) => (
          <div key={t.ref} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-zinc-200">{t.type} ({t.ref})</div>
              <div className="text-[10px] text-zinc-400">{t.date} • Korapay Verification: {t.status}</div>
            </div>
            <div className={`font-extrabold text-sm ${t.amt.startsWith("+") ? "text-emerald-400" : "text-amber-400"}`}>
              {t.amt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
