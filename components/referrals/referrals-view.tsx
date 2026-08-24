"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  Coins01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/ui/empty-state";

export function ReferralsView({
  referralUrl,
  handle,
}: {
  referralUrl: string;
  handle: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-8 pb-20">
      <div className="pb-6 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Invite Friends & Earn
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
          Share your referral link. Bonuses only appear here after they are recorded on your account.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Total Friends Invited</span>
            <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-primary" />
          </div>
          <span className="text-3xl font-black text-foreground">0</span>
          <span className="text-[11px] text-muted-foreground block">No referrals recorded yet</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Paid Bonuses</span>
            <HugeiconsIcon icon={Coins01Icon} size={18} className="text-primary" />
          </div>
          <span className="text-3xl font-black text-primary">₦0.00</span>
          <span className="text-[11px] text-muted-foreground font-semibold block">From recorded referral payouts</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Pending Bonuses</span>
            <HugeiconsIcon icon={StarIcon} size={18} className="text-warning" />
          </div>
          <span className="text-3xl font-black text-warning">₦0.00</span>
          <span className="text-[11px] text-muted-foreground block">Awaiting recorded completions</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">Your Personal Referral Link</h3>
          <p className="text-xs text-muted-foreground">Share your link via WhatsApp, Telegram, or Social Media.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 h-[48px] px-4 rounded-xl bg-card border border-border flex items-center justify-between font-mono text-xs sm:text-sm text-foreground">
            <span className="truncate">{referralUrl}</span>
            <span className="text-primary font-bold text-xs uppercase ml-2">{handle}</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="h-[48px] px-6 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
          >
            {copied ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Copy01Icon} size={16} />
                <span>Copy Referral Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Invited Friends History</h3>
        </div>
        <EmptyState
          title="No referrals yet"
          description="Friends who join with your link will appear here after their signup is recorded."
        />
      </div>
    </div>
  );
}
