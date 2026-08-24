"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Coins01Icon,
  Download01Icon,
  Copy01Icon,
  Building01Icon,
} from "@hugeicons/core-free-icons";

export interface WalletTransactionItem {
  id: string;
  title: string;
  type: string;
  amount: string;
  status: string;
  date: string;
  refCode?: string;
}

interface TransactionDetailsModalProps {
  transaction: WalletTransactionItem | null;
  onClose: () => void;
}

export function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const isWithdrawal = transaction.type === "Withdrawal";

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.refCode || "TX_ZOL982104");
    alert("Transaction reference copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[440px] bg-card border border-border rounded-3xl p-6 shadow-2xl relative text-foreground space-y-6">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${
              isWithdrawal
                ? "bg-warning/10 border-warning/20 text-warning"
                : "bg-primary-subtle border-primary/20 text-primary"
            }`}
          >
            <HugeiconsIcon icon={isWithdrawal ? Building01Icon : Coins01Icon} size={28} />
          </div>

          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
            {transaction.type} Receipt
          </span>
          <h3 className="text-3xl font-black text-foreground tracking-tight">{transaction.amount}</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-primary-subtle text-primary text-[10px] font-bold border border-primary/20 inline-block">
            ● {transaction.status}
          </span>
        </div>

        <div className="space-y-3 p-4 rounded-2xl bg-card border border-border text-xs">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <span className="text-muted-foreground">Description</span>
            <span className="font-bold text-foreground text-right max-w-[200px] truncate">{transaction.title}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="font-medium text-foreground">{transaction.date}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reference Code</span>
            <div className="flex items-center gap-1.5 font-mono text-primary font-bold">
              <span>{transaction.refCode || "TX_ZOL982104"}</span>
              <button type="button" onClick={handleCopyRef} className="text-muted-foreground hover:text-foreground p-0.5">
                <HugeiconsIcon icon={Copy01Icon} size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert("Downloading official digital receipt PDF...")}
            className="w-full h-[46px] rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <HugeiconsIcon icon={Download01Icon} size={16} />
            <span>Download PDF Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
}
