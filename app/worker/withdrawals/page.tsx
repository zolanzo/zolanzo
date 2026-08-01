"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function WorkerWithdrawalsPage() {
  const [amount, setAmount] = useState("50.00");
  const [payoutMethod, setPayoutMethod] = useState("mobile_money");
  const [accountNumber, setAccountNumber] = useState("0244123456");
  const [completed, setCompleted] = useState(false);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setCompleted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Korapay Instant Withdrawal</h1>
          <p className="text-zinc-400">Withdraw to Mobile Money or Bank Account</p>
        </div>
        <Link href="/worker/wallet" className="text-emerald-400 font-bold hover:underline">
          Back to Wallet
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
        {completed ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Icons.verified size={24} />
            </div>
            <h3 className="font-bold text-sm">Withdrawal Initiated!</h3>
            <p className="text-zinc-400">
              Korapay payout of ${amount} has been processed to {accountNumber}. Funds will reflect within 2 minutes.
            </p>
            <Link
              href="/worker/wallet"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold min-h-[44px]"
            >
              Return to Wallet
            </Link>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1 text-zinc-300">Payout Method</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="mobile_money">Mobile Money (MTN / M-Pesa / Airtel)</option>
                <option value="bank_account">Bank Account (GTBank / Access / Standard Chartered)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-zinc-300">Withdrawal Amount ($)</label>
              <input
                required
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-emerald-500 font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-zinc-300">Mobile Number / Account Number</label>
              <input
                required
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-md min-h-[44px]"
            >
              Confirm Payout via Korapay
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
