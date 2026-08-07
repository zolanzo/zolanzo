"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function HirerWalletPage() {
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("100000");

  const transactions = [
    { id: "tx_h1", title: "Campaign Escrow Lock: AI Data Annotation", type: "Escrow Lock", amount: "-₦722,500", date: "Today • 10:42 AM", status: "Locked" },
    { id: "tx_h2", title: "Wallet Deposit via Korapay Transfer", type: "Credit Deposit", amount: "+₦1,000,000", date: "Yesterday • 4:15 PM", status: "Completed" },
    { id: "tx_h3", title: "Escrow Release: Mobile Survey Earners", type: "Payout Disbursed", amount: "-₦252,000", date: "3 days ago", status: "Completed" },
  ];

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      
      {/* Fund Wallet Modal */}
      {fundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
          <div className="w-full max-w-[420px] bg-card border border-border rounded-3xl p-6 space-y-5 shadow-2xl relative text-foreground">
            <h3 className="text-xl font-bold">Fund Hirer Escrow Wallet</h3>
            <p className="text-xs text-muted-foreground">Add funds via Bank Transfer, Card, or Korapay.</p>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground">Amount to Deposit (₦)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-base font-bold font-mono focus:outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFundModalOpen(false)}
                className="w-1/2 h-[44px] rounded-xl border border-border text-muted-foreground font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`₦${parseInt(fundAmount).toLocaleString()} added to Hirer Escrow Wallet!`);
                  setFundModalOpen(false);
                }}
                className="w-1/2 h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Hirer Wallet & Escrow
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                Escrow Manager
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
              Fund corporate balance, allocate campaign escrow, and audit disbursement receipts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFundModalOpen(true)}
            className="h-[44px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            <span>Fund Wallet</span>
          </button>
        </div>

        {/* 4 Standard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Available Balance</span>
            <span className="text-2xl font-black text-foreground block">₦450,000</span>
            <span className="text-[11px] text-emerald-400 font-bold">Ready for Escrow</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Escrow Balance</span>
            <span className="text-2xl font-black text-emerald-400 block">₦312,000</span>
            <span className="text-[11px] text-emerald-400 font-bold">Locked in Active Campaigns</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Pending Payments</span>
            <span className="text-2xl font-black text-amber-400 block">₦120,000</span>
            <span className="text-[11px] text-muted-foreground">Awaiting Submission Review</span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Lifetime Spend</span>
            <span className="text-2xl font-black text-foreground block">₦3,480,000</span>
            <span className="text-[11px] text-muted-foreground">100% Verified Escrow</span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Transactions</h3>
            <button type="button" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
              <HugeiconsIcon icon={Download01Icon} size={14} /> Export Statement
            </button>
          </div>

          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-foreground">{tx.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{tx.date} • {tx.type}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-foreground block">{tx.amount}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
