"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  Share01Icon,
  Coins01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function InviteFriendsPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "GRACE2026";
  const referralLink = "https://zolanzo.com/signup?ref=GRACE2026";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referrals: { name: string; date: string; bonus: string; status: string }[] = [];

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1100px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Invite Friends & Earn
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              ₦1,000 per Referral
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
            Earn ₦1,000 for every friend who registers with your referral code and completes their first task.
          </p>
        </div>

        {/* 3 Referral Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Friends Invited</span>
              <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-emerald-400" />
            </div>
            <span className="text-3xl font-black text-white">{referrals.length}</span>
            <span className="text-[11px] text-zinc-400 block">Registered Users</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Paid Bonuses</span>
              <HugeiconsIcon icon={Coins01Icon} size={18} className="text-emerald-400" />
            </div>
            <span className="text-3xl font-black text-emerald-400">₦12,000</span>
            <span className="text-[11px] text-emerald-400 font-semibold block">Credited to Wallet</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Pending Bonuses</span>
              <HugeiconsIcon icon={StarIcon} size={18} className="text-amber-400" />
            </div>
            <span className="text-3xl font-black text-amber-400">₦3,000</span>
            <span className="text-[11px] text-zinc-400 block">Awaiting First Task</span>
          </div>
        </div>

        {/* Share Section Card */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Your Personal Referral Link</h3>
            <p className="text-xs text-zinc-400">Share your link via WhatsApp, Telegram, or Social Media.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-xs sm:text-sm text-zinc-200">
              <span className="truncate">{referralLink}</span>
              <span className="text-emerald-400 font-bold text-xs uppercase ml-2">{referralCode}</span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="h-[48px] px-6 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
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

        {/* Referral List */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Invited Friends History</h3>
            <span className="text-xs font-bold text-emerald-400">3 Recent</span>
          </div>

          <div className="space-y-2">
            {referrals.map((ref, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <HugeiconsIcon icon={Share01Icon} size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{ref.name}</p>
                    <p className="text-[10px] text-zinc-500">{ref.date}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-400 block">{ref.bonus}</span>
                  <span className="text-[10px] text-zinc-400 block">{ref.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
