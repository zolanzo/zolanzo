"use client";

import React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { MobileFullWidthHero } from "@/components/shell/mobile-full-width-hero";
import { PhoneGateModal } from "@/components/auth/phone-gate-modal";
import { usePhoneGate } from "@/hooks/use-phone-gate";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  ArrowUp01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

export default function MobileWalletPage() {
  const { isOpen, actionName, triggerGate, handleVerified, handleClose } = usePhoneGate();

  const transactions = [
    { id: "tx_1", title: "TikTok Follow Task", date: "Today, 02:15 PM", amount: "+₦30", status: "Completed", type: "in" },
    { id: "tx_2", title: "Instagram Like Task", date: "Today, 01:40 PM", amount: "+₦20", status: "Completed", type: "in" },
    { id: "tx_3", title: "Bank Withdrawal (Kuda)", date: "Yesterday", amount: "-₦1,500", status: "Completed", type: "out" },
    { id: "tx_4", title: "YouTube Subscribe Task", date: "2 days ago", amount: "+₦35", status: "Pending", type: "in" },
  ];

  return (
    <AppShell userName="Earner" avatarUrl="/brand/lady1.png">
      <PhoneGateModal
        isOpen={isOpen}
        actionName={actionName}
        onVerified={handleVerified}
        onClose={handleClose}
      />

      <MobileFullWidthHero
        firstName="Earner"
        availableBalance="₦12,350"
        pendingReview="₦1,250"
      />

      <div className="max-w-2xl mx-auto space-y-4 px-4 sm:px-0 py-1">

        {/* DAYLIGHT BALANCES CARD (#FFFFFF Card, #0B8F4D Money) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider block">
                Wallet Balance
              </span>
              <span className="text-2xl font-black text-[#0B8F4D]">₦12,350.00</span>
            </div>

            <button
              type="button"
              onClick={() => triggerGate("Withdraw Funds", () => alert("Withdrawal request initiated."))}
              className="h-[38px] px-4 rounded-xl bg-[#0B8F4D] hover:bg-[#097A42] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <HugeiconsIcon icon={ArrowUp01Icon} size={15} />
              <span>Withdraw</span>
            </button>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-[#666666] font-medium">Pending Review Balance</span>
            <span className="font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">₦1,250.00</span>
          </div>
        </div>

        {/* TRANSACTION HISTORY ROWS */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#111111] tracking-wide uppercase px-0.5">
            Transaction History
          </h2>

          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden shadow-xs">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.type === "in" ? "bg-[#E6F4ED] text-[#0B8F4D]" : "bg-gray-100 text-gray-500"
                  }`}>
                    <HugeiconsIcon icon={tx.type === "in" ? CheckmarkCircle01Icon : Wallet01Icon} size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111111] leading-tight">{tx.title}</h3>
                    <span className="text-[10px] text-[#666666]">{tx.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-black text-xs block ${
                    tx.type === "in" ? "text-[#0B8F4D]" : "text-[#111111]"
                  }`}>
                    {tx.amount}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    tx.status === "Completed" ? "text-[#0B8F4D]" : "text-amber-600"
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
