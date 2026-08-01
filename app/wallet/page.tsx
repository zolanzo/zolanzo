"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  CheckmarkBadge01Icon,
  Building01Icon,
  AnalyticsUpIcon,
  Coins01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { WithdrawalModal } from "@/components/wallet/withdrawal-modal";
import { BankManagerModal } from "@/components/wallet/bank-manager-modal";
import { TransactionDetailsModal, type WalletTransactionItem } from "@/components/wallet/transaction-details-modal";
import { EmptyState } from "@/components/ui/empty-state";

type ChartPeriod = "Weekly" | "Monthly" | "Yearly";
type TxFilter = "All" | "Credits" | "Withdrawals";

export default function WalletPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("Monthly");
  const [txFilter, setTxFilter] = useState<TxFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<WalletTransactionItem | null>(null);

  const transactions: WalletTransactionItem[] = [
    { id: "tx_1", title: "AI Model Image Labeling", type: "Earned", amount: "+₦850", status: "Completed", date: "Today, 2:15 PM", refCode: "TX_ZOL98104" },
    { id: "tx_2", title: "Disbursement to GTBank", type: "Withdrawal", amount: "-₦18,400", status: "Successful", date: "Yesterday, 4:30 PM", refCode: "TX_ZOL98105" },
    { id: "tx_3", title: "Mobile Banking User Survey", type: "Earned", amount: "+₦1,200", status: "Completed", date: "2 days ago", refCode: "TX_ZOL98106" },
    { id: "tx_4", title: "Customer Chat Support Shift", type: "Earned", amount: "+₦5,000", status: "Completed", date: "3 days ago", refCode: "TX_ZOL98107" },
    { id: "tx_5", title: "Referral Bonus (Grace A.)", type: "Bonus", amount: "+₦1,000", status: "Completed", date: "4 days ago", refCode: "TX_ZOL98108" },
  ];

  const filteredTx = transactions.filter((tx) => {
    const matchesFilter =
      txFilter === "All"
        ? true
        : txFilter === "Withdrawals"
        ? tx.type === "Withdrawal"
        : tx.type !== "Withdrawal";
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      {/* Withdrawal Security Modal */}
      <WithdrawalModal
        isOpen={withdrawOpen}
        availableBalance="₦283,600"
        onClose={() => setWithdrawOpen(false)}
        onSuccess={() => alert("Withdrawal logged to transactions.")}
      />

      {/* Bank Manager Modal */}
      <BankManagerModal
        isOpen={bankOpen}
        onClose={() => setBankOpen(false)}
        onBankAdded={(bName) => alert(`Bank ${bName} added successfully!`)}
      />

      {/* Digital Receipt Modal */}
      <TransactionDetailsModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      <div className="max-w-[1280px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Wallet & Payouts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                ● Instant Payout Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Manage your balance, disburse funds to bank accounts, and track your lifetime earnings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="h-[48px] px-6 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Withdraw Funds</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </button>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Available Balance</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <HugeiconsIcon icon={Wallet01Icon} size={16} />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white block">₦283,600</span>
            <span className="text-[11px] text-emerald-400 font-semibold block">Disbursement Available</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pending Balance</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <HugeiconsIcon icon={Clock01Icon} size={16} />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">₦7,250</span>
            <span className="text-[11px] text-zinc-400 block">Reviewing Submissions</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Lifetime Earnings</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <HugeiconsIcon icon={Coins01Icon} size={16} />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white block">₦1,840,000</span>
            <span className="text-[11px] text-emerald-400 font-semibold block">100% Cleared</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Approval Rating</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <HugeiconsIcon icon={AnalyticsUpIcon} size={16} />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white block">98.4%</span>
            <span className="text-[11px] text-purple-400 font-semibold block">Top Tier Earner</span>
          </div>

        </div>

        {/* Middle Section: Linked Bank Accounts & Earnings Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Linked Accounts */}
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Linked Bank Account</h3>
              <span className="text-xs font-bold text-emerald-400">Verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Building01Icon} size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Guaranty Trust Bank (GTBank)</p>
                  <p className="text-xs text-zinc-400 font-mono">012****890 • Grace Adebayo</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-400 font-semibold">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
                <span>Primary Payout Account</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBankOpen(true)}
              className="w-full h-[42px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
            >
              + Add Bank Account
            </button>
          </div>

          {/* Analytics Chart Box */}
          <div className="lg:col-span-2 bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payout Analytics</h3>
              
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                {(["Weekly", "Monthly", "Yearly"] as ChartPeriod[]).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      chartPeriod === period
                        ? "bg-[#008744] text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center pt-2">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Week 1</span>
                <span className="text-base font-bold text-white block mt-1">₦42,000</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Week 2</span>
                <span className="text-base font-bold text-white block mt-1">₦68,500</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Week 3</span>
                <span className="text-base font-bold text-white block mt-1">₦54,100</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-400 block font-bold">Week 4 (Current)</span>
                <span className="text-base font-bold text-emerald-400 block mt-1">₦119,000</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transaction History & Search/Filters */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transaction Activity & Receipts</h3>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                {(["All", "Credits", "Withdrawals"] as TxFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTxFilter(f)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      txFilter === f ? "bg-[#008744] text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-36 h-[32px] pl-7 pr-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-xs focus:outline-none"
                />
                <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description="No wallet transactions match your filter criteria."
            />
          ) : (
            <div className="space-y-2">
              {filteredTx.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        tx.type === "Withdrawal"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {tx.type === "Withdrawal" ? "↓" : "↑"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{tx.title}</p>
                      <p className="text-[10px] text-zinc-500">{tx.date} • {tx.type}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-black ${tx.type === "Withdrawal" ? "text-amber-400" : "text-emerald-400"}`}>
                      {tx.amount}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-semibold">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
