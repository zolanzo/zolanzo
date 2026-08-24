"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Wallet01Icon, ArrowRight01Icon, Clock01Icon } from "@hugeicons/core-free-icons";

interface WalletCardProps {
  availableBalance?: string;
  todayEarnings?: string;
  pendingEarnings?: string;
  onWithdraw?: () => void;
  onHistory?: () => void;
}

export function WalletCard({
  availableBalance = "₦0",
  todayEarnings = "₦0",
  pendingEarnings = "₦0",
  onWithdraw,
  onHistory,
}: WalletCardProps) {
  return (
    <div className="relative w-full space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-floating sm:p-7">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary-subtle text-primary">
            <HugeiconsIcon icon={Wallet01Icon} size={18} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wallet Balance</span>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          ● Live Status
        </span>
      </div>

      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Available Balance
        </span>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black leading-none tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {availableBalance}
          </span>
          <span className="rounded-md border border-primary/20 bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary">
            Instant Payout
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="rounded-2xl border border-border bg-muted p-3.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Today&apos;s Earnings
          </span>
          <span className="mt-1 block text-xl font-black text-primary sm:text-2xl">{todayEarnings}</span>
        </div>

        <div className="rounded-2xl border border-border bg-muted p-3.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Earnings
          </span>
          <span className="mt-1 block text-xl font-black text-foreground sm:text-2xl">{pendingEarnings}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onWithdraw}
          className="primary-action flex h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold"
        >
          <span>Withdraw</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>

        <button
          type="button"
          onClick={onHistory}
          className="secondary-action flex h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold"
        >
          <HugeiconsIcon icon={Clock01Icon} size={16} />
          <span>History</span>
        </button>
      </div>
    </div>
  );
}
