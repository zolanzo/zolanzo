"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function OrganizationEscrowPage() {
  const [depositAmount, setDepositAmount] = useState("500.00");
  const [funded, setFunded] = useState(false);

  const handleFund = (e: React.FormEvent) => {
    e.preventDefault();
    setFunded(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-4xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Organization Escrow Wallet</h1>
          <p className="text-zinc-400">Korapay virtual bank account & instant deposit portal</p>
        </div>
        <Link href="/organization/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Virtual Account Box */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 font-bold text-zinc-200">
            <Icons.bank size={18} className="text-emerald-400" /> Korapay Virtual Bank Account
          </div>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono">
            <div><span className="text-zinc-500">Bank:</span> Wema Bank / Korapay</div>
            <div><span className="text-zinc-500">Account No:</span> 0123456789</div>
            <div><span className="text-zinc-500">Account Name:</span> ZOLANZO / Global Media Corp</div>
          </div>
          <p className="text-zinc-400 text-[11px]">
            Transfers to this dedicated virtual account automatically credit your campaign escrow pool in real-time.
          </p>
        </div>

        {/* Card Deposit Form */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-bold text-zinc-200">Instant Card / Mobile Money Deposit</h3>

          {funded ? (
            <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-center space-y-2">
              <Icons.verified size={20} className="mx-auto" />
              <div>Deposit of ${depositAmount} Successful!</div>
              <p className="text-[11px] text-zinc-300 font-normal">Funds locked in escrow pool via Korapay.</p>
            </div>
          ) : (
            <form onSubmit={handleFund} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-zinc-300">Deposit Amount ($)</label>
                <input
                  required
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-md min-h-[44px]"
              >
                Deposit via Korapay Checkout
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
